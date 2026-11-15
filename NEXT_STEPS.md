# Próximos Passos — PRISMA Fase 1

**Última atualização:** 2026-11-12  
**Contexto:** Documentação base completa. Rust toolchain e VS Build Tools pendentes.

---

## Ação Imediata Necessária: Instalar Rust + Build Tools

As tentativas automatizadas (winget, download direto, BITS, WebClient) falharam devido a restrições de rede/TLS no ambiente atual.

### Opção 1: Instalação Manual (Recomendada)

**Rust (rustup):**
1. Acesse: https://rustup.rs
2. Baixe `rustup-init.exe` (x86_64-pc-windows-msvc)
3. Execute com opções padrão: `rustup-init.exe -y --default-toolchain stable --profile minimal`
4. Reinicie o terminal/PowerShell
5. Verifique: `rustc --version` e `cargo --version`

**Visual Studio Build Tools 2022:**
1. Acesse: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
2. Baixe "Build Tools for Visual Studio 2022"
3. Execute o instalador
4. Selecione workload: **"Desenvolvimento para desktop com C++"** (inclui MSVC v143, Windows 10/11 SDK)
5. Instale (pode demorar 10-30 min)

### Opção 2: Tentar winget novamente (se rede permitir)

```powershell
# Atualizar sources
winget source update

# Rust
winget install --id Rustlang.Rustup -e --accept-source-agreements --accept-package-agreements

# VS Build Tools (somente VC++ tools)
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --accept-source-agreements --accept-package-agreements --override "--quiet --wait --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

### Opção 3: Chocolatey (se disponível)

```powershell
# Instalar Chocolatey primeiro (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Depois:
choco install rustup.install -y
choco install visualstudio2022buildtools -y --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

---

## Após Instalação: Verificar e Inicializar

```powershell
# Verificar ferramentas
rustc --version
cargo --version
node --version
npm --version

# Inicializar app Tauri em apps/desktop
cd C:\Users\charl\nanoMuse\PRISMA\apps\desktop
cargo tauri init

# Respostas sugeridas para o wizard:
# App name: PRISMA
# Window title: PRISMA
# Frontend: TypeScript / React / Vite
# CSS: CSS (vamos usar tokens customizados)
# Package manager: npm

# Instalar dependências
npm install

# Verificar build
cargo check
npm run build

# Dev server
cargo tauri dev
```

---

## Próximos Marcos (em ordem)

| # | Marco | Estimativa | Dependência |
|---|-------|------------|-------------|
| 1 | Rust + VS Build Tools instalados e verificados | Imediato | **Manual** |
| 2 | `cargo tauri init` concluído | 10 min | #1 |
| 3 | `tauri.conf.json` configurado (allowlist, ícone, bundle) | 30 min | #2 |
| 4 | Design System (packages/ui) - tokens + componentes base | 2-3 h | #2 |
| 5 | Navegação & Shell (React Router, Sidebar, Panel LIA) | 2-3 h | #4 |
| 6 | SQLite & Migrações (crates/storage, sqlx, migração 001/002) | 3-4 h | #2 |
| 7 | Onboarding Universal (wizard 5 passos) | 2-3 h | #6 |
| 8 | Library Inicial (importar, hash, listar, abrir, deduplicar) | 2-3 h | #6 |
| 9 | Search Textual Inicial (FTS5, triggers, UI busca) | 2-3 h | #6 |
| 10 | Dashboard Inicial (cards derivados) | 1-2 h | #6, #8 |
| 11 | Settings, Backup, Logs | 2-3 h | #6 |
| 12 | Build produção + NSIS installer teste | 1-2 h | #11 |
| 13 | Smoke test em perfil/VM limpo | 30 min | #12 |

**Total estimado Fase 1 (após toolchain): 20-30 horas de desenvolvimento**

---

## Comandos de Verificação Contínua

```bash
# No diretório apps/desktop
cargo test --workspace          # Testes Rust
cargo clippy --workspace -- -D warnings  # Lint Rust
npm test                        # Testes frontend
npm run lint                    # Lint frontend
cargo tauri build               # Build release (gera .exe NSIS)
```

---

## Notas Importantes

1. **Não pular testes** — Cada módulo deve ter testes unitários + integração passando antes de avançar
2. **Registrar evidência** — Exit codes, outputs, prints em `TEST_RESULTS.md` (criar quando iniciar testes)
3. **Atualizar `IMPLEMENTATION_STATUS.md`** a cada marco
4. **Commits atômicos** — Mensagens convencionais: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
5. **Não configurar push automático** — Repositório local apenas por enquanto

---

## Se Houver Bloqueio Persistente (> 2 dias)

1. Documentar em `IMPLEMENTATION_STATUS.md` com detalhes
2. Buscar alternativa mais simples/segura/gratuita
3. Se irreversível ou afeta dados/sistema → solicitar autorização

---

*Este arquivo serve como guia de retomada entre sessões. Não dependa de memória.*