// SQLite connection helper.
// Every SQLite connection MUST go through open_db() — never call Connection::open() directly.
// open_db() will set required PRAGMAs (WAL mode, foreign keys, etc.) on every connection.

// TODO: implement open_db() in Story 1.3 using rusqlite.
