use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use crate::errors::AppError;
use crate::models::TestConnectionParams;

pub struct ConnectionManager;

impl ConnectionManager {
    pub fn new() -> Self {
        Self
    }

    pub async fn test(&self, params: &TestConnectionParams) -> Result<(), AppError> {
        let options = PgConnectOptions::new()
            .host(&params.host)
            .port(params.port)
            .database(&params.database)
            .username(&params.username)
            .password(&params.password);
        let pool = PgPoolOptions::new()
            .acquire_timeout(std::time::Duration::from_secs(5))
            .max_connections(1)
            .connect_with(options)
            .await
            .map_err(map_sqlx_error)?;
        pool.close().await;
        Ok(())
    }
}

fn map_sqlx_error(e: sqlx::Error) -> AppError {
    let msg = e.to_string();
    match &e {
        sqlx::Error::PoolTimedOut => AppError::ConnectionTimeout(5),
        sqlx::Error::Database(db_err) => {
            let code = db_err.code().unwrap_or_default();
            match code.as_ref() {
                "28P01" | "28000" => AppError::AuthFailed(msg),
                "3D000" => AppError::DatabaseNotFound(msg),
                _ => AppError::Internal(msg),
            }
        }
        _ => {
            if msg.contains("Connection refused")
                || msg.contains("timed out")
                || msg.contains("No route to host")
                || msg.contains("os error 10061")
            {
                AppError::HostUnreachable(msg)
            } else {
                AppError::Internal(msg)
            }
        }
    }
}
