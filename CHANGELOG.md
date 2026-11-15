# Changelog — PRISMA + LIA

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased] — Fase 1 em desenvolvimento

### Adicionado
- Documentação base: README.md, ARCHITECTURE.md, SPEC.md, DATA_MODEL.md, SECURITY.md, SOURCE_POLICY.md, TEST_PLAN.md, ROADMAP.md
- Estrutura de diretórios do workspace PRISMA (apps, crates, packages, services, tests, docs, fixtures, build)
- Diagnóstico de ambiente: Windows 10/11 (Build 26200), AMD64, Intel Celeron N4020C (2 cores/2 threads, ~1.1 GHz), Python 3.12, Node 24.19.0, Git 2.55, WebView2 157.0.4341.46 presente
- **Pendente:** Rust toolchain (instalação em andamento), Visual Studio Build Tools

### Decisões Arquiteturais (ADRs)
- ADR-001: Tauri 2 + Rust + React/TypeScript
- ADR-002: SQLite com FTS5
- ADR-003: Nemotron 3 Ultra via NVIDIA (OpenAI-compatible)
- ADR-004: Python Sidecar apenas quando justificado (SymPy, OCR)
- ADR-005: FSRS para repetição espaçada
- ADR-006: Design System Graphite Academic
- ADR-007: NSIS Installer per-user

### Conhecido
- Rust toolchain não instalado — bloqueia `cargo tauri init` e build
- Visual Studio Build Tools não instalado — necessário para linker MSVC
- Sem medidor de disco livre confiável no ambiente atual (permissões WMI limitadas)

---

## Formato de Entradas Futuras

### [X.Y.Z] - YYYY-MM-DD
#### Adicionado
- Nova funcionalidade

#### Alterado
- Mudança em funcionalidade existente

#### Corrigido
- Correção de bug

#### Removido
- Funcionalidade removida

#### Segurança
- Correção de vulnerabilidade

#### Dependências
- Atualização de dependências

---

*Este changelog é atualizado a cada commit significativo. Ver `git log --oneline` para histórico completo.*