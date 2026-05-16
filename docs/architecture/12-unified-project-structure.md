# 12. Unified Project Structure

```plaintext
schemalift/
├── .github/workflows/.gitkeep       # CI/CD placeholder (post-MVP)
├── src/                             # React frontend
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── layout/
│   │   ├── connection/
│   │   ├── schema/
│   │   ├── prompt/
│   │   └── settings/
│   ├── screens/
│   ├── store/appStore.ts
│   ├── commands/index.ts
│   ├── hooks/
│   ├── types/index.ts
│   ├── lib/utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/                       # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── models.rs
│   │   ├── errors.rs
│   │   ├── db.rs
│   │   ├── credential_store.rs
│   │   ├── commands/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── migrations/001_initial.sql
│   ├── icons/
│   ├── Cargo.toml
│   ├── Cargo.lock
│   └── tauri.conf.json
├── docs/
│   ├── brief.md
│   ├── prd.md
│   └── architecture.md
├── .env.example
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── components.json
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── vite.config.ts
```

---
