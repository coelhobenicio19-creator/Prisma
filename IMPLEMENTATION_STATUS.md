# Status de Implementação — PRISMA + LIA

**Última atualização:** 2026-11-12  
**Fase atual:** 1 — PRISMA Foundation  
**Status geral:** 🟡 Documentação base completa; toolchain Rust pendente

---

## Resumo por Fase

| Fase | Nome | Status | Progresso | Gate |
|------|------|--------|-----------|------|
| 1 | PRISMA Foundation | 🟡 Em andamento | 25% (docs ✅, code ❌) | App abre, persiste, build + installer teste |
| 2 | PRISMA Academic | ⏳ Não iniciado | 0% | Pipeline PDF→estatística rastreável |
| 3 | PRISMA Learning | ⏳ Não iniciado | 0% | Jornada offline completa |
| 4 | PRISMA Intelligence | ⏳ Não iniciado | 0% | LIA real autorizada |
| 5 | PRISMA Studio & Advanced | ⏳ Não iniciado | 0% | Arquivos gerados abrem, voz opt-in |
| 6 | PRISMA Stable | ⏳ Não iniciado | 0% | Instalador NSIS verificado |

---

## Status por Módulo (M01–M24)

| Módulo | Fase | Status | Notas |
|--------|------|--------|-------|
| M01 Learn | 3 | ⏳ | Aguarda Fase 3 |
| M02 Atlas | 2/3 | ⏳ | Base na Fase 2, completo na 3 |
| M03 Error Lab | 3 | ⏳ | Aguarda Fase 3 |
| M04 Recall | 3 | ⏳ | FSRS crate selecionado |
| M05 Focus | 1/3 | ⏳ | Timer monotônico na Fase 1 |
| M06 Exams | 2/3 | ⏳ | Core na Fase 2, completo na 3 |
| M07 Questions | 2 | ⏳ | Aguarda Fase 2 |
| M08 Exam Intelligence | 2 | ⏳ | Aguarda Fase 2 |
| M09 Forecast | 3/5 | ⏳ | Inicial na 3, expandido na 5 |
| M10 Reader | 1/2/5 | ⏳ | Inicial na 1, completo na 2/5 |
| M11 Library | 1/2 | 🟡 | **Iniciado na Fase 1** (importação local) |
| M12 Search | 1/2 | 🟡 | **Iniciado na Fase 1** (FTS5) |
| M13 Compare | 2 | ⏳ | Aguarda Fase 2 |
| M14 Formula | 4/5 | ⏳ | Sidecar Python (SymPy) |
| M15 Planner | 1/3 | 🟡 | **Iniciado na Fase 1** (básico) |
| M16 Projects | 3 | ⏳ | Aguarda Fase 3 |
| M17 School | 3 | ⏳ | Aguarda Fase 3 |
| M18 Dashboard | 1/3 | 🟡 | **Iniciado na Fase 1** (básico) |
| M19 Studio | 5 | ⏳ | Aguarda Fase 5 |
| M20 Board | 5 | ⏳ | Aguarda Fase 5 |
| M21 Lab | 5 | ⏳ | Aguarda Fase 5 |
| M22 Oral | 5 | ⏳ | Aguarda Fase 5 |
| M23 LIA | 4 | ⏳ | Aguarda Fase 4 + chave NVIDIA |
| M24 Active Learning | 4 | ⏳ | Aguarda Fase 4 |

---

## Entregas Verificadas (Fase 1 até agora)

### Documentação Base ✅
- [x] `README.md` — Visão geral, 24 módulos, 6 fases, quick start
- [x] `ARCHITECTURE.md` — Arquitetura, ADRs, modelo de segurança, IPC contracts
- [x] `SPEC.md` — Especificação funcional detalhada (RF01.1–RF24.4)
- [x] `DATA_MODEL.md` — Schema SQL completo (10 grupos de tabelas, índices, FTS5, migrações)
- [x] `SECURITY.md` — Allowlist Tauri, DPAPI, telemetria OFF, voz, prompt injection
- [x] `SOURCE_POLICY.md` — Classificação de fontes, extração, questões, estatísticas, defesa
- [x] `TEST_PLAN.md` — 16 cenários obrigatórios, matriz por fase, fixtures, métricas
- [x] `ROADMAP.md` — Épicos por fase, marcos Go/No-Go, riscos, estimativas
- [x] `CHANGELOG.md` — Iniciado com diagnósticos e ADRs
- [x] `IMPLEMENTATION_STATUS.md` — Este arquivo

### Estrutura de Workspace ✅
```
PRISMA/
├── apps/desktop/          # Tauri app (vazio)
├── crates/
│   ├── domain/            # Entidades, value objects (vazio)
│   ├── storage/           # SQLite, migrações, repos (vazio)
│   ├── academic/          # Lógica acadêmica (vazio)
│   ├── assessment/        # Provas, questões (vazio)
│   ├── learning/          # FSRS, Atlas, Error Lab (vazio)
│   ├── lia/               # Orquestração LIA (vazio)
│   └── security/          # DPAPI, criptografia (vazio)
├── packages/
│   ├── ui/                # Design System React (vazio)
│   └── contracts/         # Tipos TS/Rust compartilhados (vazio)
├── services/docproc/      # Python sidecar (vazio)
├── tests/                 # Testes integração/E2E (vazio)
├── docs/                  # Documentação (preenchida acima)
├── fixtures/              # Fixtures de teste (vazio)
└── build/                 # Scripts de build/installer (vazio)
```

### Diagnóstico de Ambiente ✅
| Componente | Status | Versão/Detalhes |
|------------|--------|-----------------|
| Windows | ✅ | 10/11 Build 26200 (24H2) |
| Arquitetura | ✅ | AMD64 |
| CPU | ✅ | Intel Celeron N4020C @ 1.10 GHz (2C/2T) |
| Python | ✅ | 3.12.10 |
| Node.js | ✅ | 24.19.0 |
| npm | ✅ | 11.17.0 |
| Git | ✅ | 2.55.0.windows.3 |
| WebView2 | ✅ | 157.0.4341.46 (sistema) |
| Rust (cargo/rustc) | ❌ | **Não instalado** — instalação em andamento |
| Visual Studio Build Tools | ❌ | **Não instalado** — necessário para MSVC linker |
| Espaço disco C: | ❓ | Não pôde ser medido (permissões WMI) |

---

## Bloqueios Atuais

| Bloqueio | Severidade | Impacto | Ação |
|----------|------------|---------|------|
| **Rust toolchain não instalado** | 🔴 Crítico | Impede `cargo tauri init`, build, qualquer código Rust | Tentativa via winget falhou; tentando download direto com TLS 1.2; se falhar, instruir instalação manual via https://rustup.rs |
| **Visual Studio Build Tools ausente** | 🔴 Crítico | Linker MSVC necessário para Tauri Windows | Tentar winget `Microsoft.VisualStudio.2022.BuildTools`; se falhar, instruir instalação manual |
| **Permissões WMI limitadas** | 🟡 Médio | Não consegue ler RAM, disco, CPU via CIM/WMI | Usar alternativas (registry, env vars); documentar limitação |

---

## Próximos Passos Imediatos (Fase 1)

1. **Resolver Rust + Build Tools** — Prioridade máxima
   - Se winget/download falhar: pedir ao usuário para instalar manualmente
   - Verificar com `cargo --version` e `rustc --version` após instalação

2. **Inicializar Tauri App** — `cargo tauri init` em `apps/desktop`
   - Template: React + TypeScript + Vite
   - Configurar `tauri.conf.json` com allowlist mínima (ver `SECURITY.md`)
   - Ícone Graphite Academic, splash screen

3. **Design System (packages/ui)** — Tokens + componentes base
   - CSS custom properties: cores, espaçamento, tipografia, border-radius
   - Componentes: Button, Card, Input, Select, Sidebar, Panel, Modal, Toast, Tooltip
   - Tema claro/escuro com `prefers-color-scheme` + toggle manual

4. **Navegação & Shell (apps/desktop/src)**
   - React Router v6
   - Layout: Sidebar (240px colapsável 64px) + Área central + Painel LIA direto (320px, opcional)
   - Roteamento: `/onboarding`, `/dashboard`, `/library`, `/search`, `/settings`, `/lia`, etc.
   - Busca global `Ctrl+K` (command palette)

5. **SQLite & Migrações (crates/storage)**
   - `sqlx` com `sqlite` feature, migrações embutidas
   - Migração 001: schema completo (`DATA_MODEL.md`)
   - Migração 002: FTS5 `search_index` + triggers
   - Repositórios base: ProfileRepo, DocumentRepo, TopicRepo, QuestionRepo, etc.

6. **Onboarding Universal**
   - Wizard 5 passos: Boas-vindas → Perfil (nome, objetivo, fuso) → Telemetria (OFF default) → Chave API (opcional) → Objetivo livre
   - Persistir em `study_profile` + `user_setting`

7. **Library Inicial (M11)**
   - Comando Tauri: `import_file` (diálogo nativo), hash SHA-256, insert em `document` + `source` + `source_version`
   - Listar documentos, abrir (PDF.js no Reader), deletar, deduplicação por hash

8. **Search Textual Inicial (M12)**
   - FTS5 `search_index` populado por triggers
   - Comando `search(query, filters)` → resultados com `entity_type`, `entity_id`, snippet
   - UI: página de busca com filtros (origem, disciplina, data)

9. **Dashboard Inicial (M18)**
   - Cards: Próximos compromissos (Planner), Revisões pendentes (Recall), Documentos recentes (Library), Estatísticas básicas
   - Dados derivados de queries SQL reais

10. **Settings, Backup, Logs**
    - Página configurações: perfil, telemetria, chave API, tema, idioma, backup
    - Backup: `sqlite3 .dump` + ZIP + manifest; restauração com validação
    - Logs: `tracing` + `tracing-subscriber` (file + console), níveis configuráveis

11. **Build & Installer Test**
    - `cargo tauri build` → gera `.exe` NSIS em `apps/desktop/target/release/bundle/nsis/`
    - Smoke test: instalar em perfil/VM limpo, abrir, onboarding, criar dado, fechar, reabrir, desinstalar

---

## Testes Executados

| Teste | Status | Evidência |
|-------|--------|-----------|
| Diagnóstico ambiente | ✅ | Comandos PowerShell executados, saída registrada |
| Criação workspace | ✅ | Diretórios criados em `C:\Users\charl\nanoMuse\PRISMA` |
| Documentação base | ✅ | 10 arquivos `.md` criados e verificados |
| Rust install (winget) | ❌ | Falhou (exit code 1, sem output) |
| Rust install (download) | 🟡 | Em andamento / falhou (TLS/credenciais) |
| VS Build Tools (winget) | ❌ | Falhou (exit code 1, sem output) |

---

## Decisões Técnicas Registradas (ADRs)

| ADR | Título | Status | Data |
|-----|--------|--------|------|
| 001 | Tauri 2 + Rust + React/TypeScript | Aceito | 2026-11-12 |
| 002 | SQLite com FTS5 | Aceito | 2026-11-12 |
| 003 | Nemotron 3 Ultra via NVIDIA | Aceito | 2026-11-12 |
| 004 | Python Sidecar apenas justificado | Aceito | 2026-11-12 |
| 005 | FSRS para repetição espaçada | Aceito | 2026-11-12 |
| 006 | Design System Graphite Academic | Aceito | 2026-11-12 |
| 007 | NSIS Installer per-user | Aceito | 2026-11-12 |

---

## Próxima Atualização de Status

Após: **Rust toolchain funcional + `cargo tauri init` concluído + primeiro `cargo check` passando**

*Este arquivo deve ser atualizado a cada marco significativo. Não dependa de memória; registre aqui.*