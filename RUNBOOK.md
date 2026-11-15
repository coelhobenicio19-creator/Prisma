# Runbook — PRISMA

Guia operacional para desenvolvimento, build, teste, diagnóstico e recuperação do PRISMA.

---

## 1. Pré-requisitos de Desenvolvimento

| Ferramenta | Versão Mínima | Instalação |
|------------|---------------|------------|
| Rust (MSVC) | stable (1.80+) | `winget install Rustlang.Rustup` ou https://rustup.rs |
| Node.js | 20 LTS | `winget install OpenJS.NodeJS.LTS` ou https://nodejs.org |
| Git | 2.40+ | `winget install Git.Git` ou https://git-scm.com |
| Visual Studio Build Tools | 2022 (VC++ tools) | `winget install Microsoft.VisualStudio.2022.BuildTools` |
| WebView2 Runtime | Evergreen | Incluído no Windows 11; bootstrapper no instalador NSIS |

**Verificar:**
```bash
rustc --version
cargo --version
node --version
npm --version
git --version
```

---

## 2. Estrutura do Projeto

```
PRISMA/
├── apps/desktop/          # App Tauri (Rust + React)
│   ├── src-tauri/         # Backend Rust
│   │   ├── src/
│   │   │   ├── commands/  # Comandos IPC por domínio
│   │   │   ├── db/        # Conexão SQLite, migrações
│   │   │   ├── models/    # Structs serde (espelho de crates/domain)
│   │   │   └── main.rs    # Entry point, allowlist
│   │   ├── Cargo.toml
│   │   └── tauri.conf.json
│   ├── src/               # Frontend React
│   │   ├── components/    # UI components
│   │   ├── pages/         # Páginas/rotas
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API Tauri invoke wrappers
│   │   ├── store/         # Estado (Zustand/Redux)
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── crates/                # Rust crates isolados (domain, storage, etc.)
├── packages/              # Pacotes TS compartilhados (ui, contracts)
├── services/docproc/      # Python sidecar (se necessário)
└── ...
```

---

## 3. Comandos de Desenvolvimento

### Iniciar Ambiente Dev
```bash
cd apps/desktop
cargo tauri dev
```
- Compila Rust em modo debug
- Inicia Vite dev server (HMR)
- Abre janela Tauri com DevTools (F12)

### Build de Produção
```bash
cd apps/desktop
cargo tauri build
```
- Gera binário otimizado em `target/release/prisma.exe`
- Gera instalador NSIS em `target/release/bundle/nsis/PRISMA_Setup_<version>.exe`
- **Requer:** Visual Studio Build Tools instalado

### Testes
```bash
# Rust unit/integration
cargo test --workspace

# Frontend unit
cd apps/desktop && npm test

# E2E (Playwright)
cd apps/desktop && npx playwright test

# Lint
cargo clippy --workspace -- -D warnings
cd apps/desktop && npm run lint
```

### Formatação
```bash
cargo fmt --all
cd apps/desktop && npm run format
```

---

## 4. Banco de Dados (SQLite)

### Localização
```
%APPDATA%\PRISMA\prisma.db          # Produção
%APPDATA%\PRISMA\prisma.db-wal      # WAL mode
%APPDATA%\PRISMA\prisma.db-shm      # Shared memory
```

### Migrações
```bash
# Aplicadas automaticamente na inicialização do app
# Para desenvolvimento, estão em: apps/desktop/src-tauri/migrations/

# Ver status
sqlite3 %APPDATA%\PRISMA\prisma.db ".tables"
sqlite3 %APPDATA%\PRISMA\prisma.db "SELECT * FROM _sqlx_migrations;"
```

### Backup Manual
```bash
# Backup completo (SQL dump + hashes)
sqlite3 %APPDATA%\PRISMA\prisma.db .dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Ou usar funcionalidade do app (Settings → Backup)
```

### Restauração
```bash
# Parar app completamente
# Substituir arquivo .db
# Iniciar app → migrações aplicam se necessário
```

---

## 5. Configurações e Segredos

### Arquivo de Config (user_setting table)
- Tema, idioma, telemetria, preferências de UI
- Editável via UI: Settings → Avançado

### Chave API NVIDIA (Credential Manager)
```powershell
# Ver se existe
cmdkey /list | findstr PRISMA

# Remover (força reconfiguração)
cmdkey /delete:PRISMA_NVIDIA_API_KEY
```

### Logs
```
%APPDATA%\PRISMA\logs\prisma-<date>.log
```
- Níveis: ERROR, WARN, INFO, DEBUG, TRACE
- Configurável em Settings → Diagnósticos

---

## 6. Diagnóstico Comum

### App não abre / Crash na inicialização
1. Verificar logs em `%APPDATA%\PRISMA\logs\`
2. Executar em terminal: `PRISMA.exe` (ver stdout/stderr)
3. Causas comuns:
   - WebView2 ausente → instalar bootstrapper
   - Banco corrompido → restaurar backup ou deletar .db (dados perdidos)
   - Chave API inválida → remover do Credential Manager
   - Permissões pasta AppData → executar como usuário (não admin)

### Build falha (cargo tauri build)
| Erro | Causa | Solução |
|------|-------|---------|
| `link.exe` not found | VS Build Tools ausente | Instalar workload VCTools |
| `webview2` not found | WebView2 SDK ausente | `cargo install tauri-bundler` baixa automaticamente |
| `sqlx` offline prepare | Migrações não embutidas | `cargo sqlx prepare --workspace` |
| Out of memory | Linker + Rust simultâneos | Fechar apps pesados; aumentar swap |

### LIA não responde / Erro de API
1. Verificar chave API em Settings → IA
2. Verificar conectividade: `curl -I https://api.nvidia.com`
3. Logs: `RUST_LOG=prisma::lia=debug PRISMA.exe`
4. Códigos de erro:
   - `401` → Chave inválida/expirada
   - `429` → Rate limit (retry automático 3x)
   - `503` → Serviço indisponível (modo offline)
   - Timeout → Rede lenta (aumentar timeout em Settings)

### Busca não encontra resultados
1. Verificar FTS5: `sqlite3 prisma.db "SELECT * FROM search_index LIMIT 5;"`
2. Reindexar: Settings → Diagnósticos → Reconstruir índice de busca
3. Verificar triggers de sincronização

### Timer/Exames com tempo errado
- PRISMA usa **relógio monotônico** (`std::time::Instant`) para cronômetros
- Mudança de relógio do Windows **não afeta** tempo de prova
- Se discrepância: verificar `exam_session.time_remaining_seconds` no DB

---

## 7. Recuperação de Desastres

### Cenário: Banco corrompido (SQLite error 11/26)
```bash
# 1. Tentar recovery
sqlite3 prisma.db ".recover" > recovered.sql
sqlite3 prisma_new.db < recovered.sql

# 2. Se falhar: restaurar backup mais recente
# 3. Se sem backup: deletar .db → app recria vazio → onboarding
```

### Cenário: App não desinstala / Restos no sistema
```powershell
# Desinstalar via Windows Settings (Apps)
# Limpar pastas residuais:
Remove-Item "$env:APPDATA\PRISMA" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:LOCALAPPDATA\PRISMA" -Recurse -Force -ErrorAction SilentlyContinue
# Remover credencial
cmdkey /delete:PRISMA_NVIDIA_API_KEY
```

### Cenário: Perda de dados (usuário deletou arquivo)
- Verificar `backup_record` table por backups automáticos
- App faz backup automático diário (se configurado)
- Exportação manual: Settings → Exportar Dados (JSON/CSV)

---

## 8. Atualizações e Versionamento

### Versionamento
- SemVer: `MAJOR.MINOR.PATCH` (ex.: 1.2.3)
- `MAJOR`: Breaking changes (schema DB, IPC contracts)
- `MINOR`: Novos módulos, features
- `PATCH`: Bugfixes, docs, refactors

### Atualização do App (Futuro: Tauri Updater)
1. App verifica `https://github.com/<user>/prisma/releases/latest`
2. Baixa `.exe` NSIS assinado
3. Verifica SHA-256
4. Executa instalador silencioso `/S`
5. Reinicia app

### Migração de Dados entre Versões
- Migrações SQLx versionadas (001, 002, ...)
- Aplicadas automaticamente na inicialização
- `down.sql` testado em CI para rollback seguro

---

## 9. Métricas e Monitoramento (Dev)

### Performance Baseline (Registrar após Fase 1)
```bash
# Cold start
Measure-Command { Start-Process "PRISMA.exe" }  # Target: < 2s

# Memória
Get-Process PRISMA | Select-Object WorkingSet64  # Target: < 150 MB idle

# DB query
# Benchmark interno: 1000x SELECT profile → média < 10ms

# Bundle size
dir target/release/bundle/nsis/PRISMA_Setup_*.exe  # Target: < 80 MB
```

### Profiling
```bash
# CPU
cargo build --release --features profiling
# Use flamegraph ou Windows Performance Analyzer

# Memory
# heaptrack ou VS Diagnostic Tools
```

---

## 10. Checklist de Release (Pré-Fase 6)

- [ ] `cargo test --workspace` — 100% passing
- [ ] `npm test` + `playwright test` — 100% passing
- [ ] `cargo clippy --workspace -- -D warnings` — zero warnings
- [ ] `cargo fmt --all --check` — passing
- [ ] `npm run lint` — passing
- [ ] Build release: `cargo tauri build` — sucesso
- [ ] Instalador NSIS gerado e verificado (SHA-256)
- [ ] Smoke test em VM/perfil limpo: instalar → onboarding → usar → desinstalar
- [ ] Backup/restore testado (Cenário 14)
- [ ] Telemetria OFF por default verificada (zero tráfego)
- [ ] Chave API não vazada em logs/binário
- [ ] `THIRD_PARTY_LICENSES.md` atualizado (`cargo-deny`, `license-checker`)
- [ ] `CHANGELOG.md` atualizado
- [ ] Documentação sincronizada (ARCHITECTURE, SPEC, DATA_MODEL, etc.)

---

## 11. Contatos e Escalação

| Problema | Ação |
|----------|------|
| Bug crítico (data loss, security) | Parar desenvolvimento → fix imediato → regression test |
| Build quebrado (CI/local) | Reverter commit causador → investigar em branch |
| Dependência com vulnerabilidade | `cargo audit` / `npm audit` → atualizar ou substituir |
| Bloqueio técnico > 2 dias | Documentar em `IMPLEMENTATION_STATUS.md` → buscar alternativa |

---

*Este runbook é vivo. Atualize a cada novo procedimento descoberto.*