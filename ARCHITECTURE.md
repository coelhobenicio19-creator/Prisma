# Arquitetura do PRISMA

## Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                      PRISMA Desktop (Tauri 2)                │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript + Vite)                        │
│  ├── packages/ui          — Componentes Graphite Academic    │
│  ├── packages/contracts   — Tipos compartilhados (TS/Rust)   │
│  └── apps/desktop         — App Tauri principal              │
├─────────────────────────────────────────────────────────────┤
│  Backend (Rust — crates isolados)                            │
│  ├── crates/domain        — Entidades, value objects, enums  │
│  ├── crates/storage       — SQLite, migrações, repositórios  │
│  ├── crates/academic      — Lógica acadêmica (perfis, metas) │
│  ├── crates/assessment    — Provas, questões, correção       │
│  ├── crates/learning      — FSRS, Atlas, Error Lab, Recall   │
│  ├── crates/lia           — Orquestração LIA, ferramentas    │
│  └── crates/security      — DPAPI, criptografia, auditoria   │
├─────────────────────────────────────────────────────────────┤
│  Sidecars (opcionais, empacotados)                           │
│  └── services/docproc     — Python (SymPy, OCR, PDF)         │
└─────────────────────────────────────────────────────────────┘
```

## Princípios Arquiteturais

| Princípio | Aplicação |
|-----------|-----------|
| **Local-first** | SQLite + arquivos; zero dependência de nuvem |
| **Segurança por design** | Tauri allowlist mínima; DPAPI para segredos; sem shell exposto |
| **Privacidade padrão** | Telemetria OFF; consentimento granular; dados não saem sem aviso |
| **Modularidade** | Crates independentes; contratos tipados; IPC validado |
| **Determinismo** | FSRS, correção, estatísticas — tudo testável e reproduzível |
| **Evidência** | Toda fonte rastreável; IA rotulada; nada inventado como oficial |

## Fluxo de Dados (Fase 1)

```
User Action → React Component → Tauri Invoke (typed) → Rust Command
                                                     ↓
                                            crates/storage (SQLite)
                                                     ↓
                                            crates/domain (validation)
                                                     ↓
                                              Return Result → UI
```

## Decisões Arquiteturais (ADRs)

### ADR-001: Tauri 2 + Rust + React/TypeScript
**Status:** Aceito
**Justificativa:** Binário nativo Windows, segurança via allowlist, bundle size pequeno, WebView2 do sistema, ecossistema maduro.
**Alternativas:** Electron (maior, menos seguro), Flutter (Dart, não Rust), WinUI 3 (sem React).

### ADR-002: SQLite com FTS5
**Status:** Aceito
**Justificativa:** Zero-config, ACID, FTS5 nativo para busca, migrações versionadas, backup simples (arquivo único).
**Alternativas:** IndexedDB (não nativo), PostgreSQL (requer servidor), Realm (licença).

### ADR-003: Nemotron 3 Ultra via NVIDIA (OpenAI-compatible)
**Status:** Aceito
**Justificativa:** Endpoint já acessível ao usuário; custo zero; modelo forte para tarefas acadêmicas.
**Riscos:** Rate limits, indisponibilidade, mudanças de API — mitigados com retry, cache, fallback offline.

### ADR-004: Python Sidecar apenas quando justificado
**Status:** Aceito
**Justificativa:** SymPy para M14 Formula, OCR/pdfplumber para M10/M11. Empacotado no binário. Limites de tempo/memória/IPC tipado.
**Não usar para:** Lógica de negócio, persistência, orquestração.

### ADR-005: FSRS (spaced repetition)
**Status:** Aceito
**Justificativa:** Algoritmo aberto, validado, parâmetros ajustáveis, implementação Rust disponível (`fsrs` crate).
**Fallback:** SM-2 se FSRS falhar.

### ADR-006: Design System Graphite Academic
**Status:** Aceito
**Paleta:** Grafite `#171B21`, Superfícies `#292F38`, Marfim `#F2F1ED`, Verde-sálvia `#8AA7A1`, Cinza `#A0A6AF`.
**Tokens:** CSS custom properties; modo claro/escuro; WCAG AA.

### ADR-007: NSIS Installer (per-user)
**Status:** Aceito
**Justificativa:** Sem UAC/admin; WebView2 bootstrapper; preservação de dados na desinstalação; checksum SHA-256.

## Modelo de Segurança

```
┌─────────────────┐     Allowlist      ┌──────────────────┐
│   Frontend      │ ─────────────────▶ │   Rust Commands  │
│   (React)       │  typed IPC (JSON)  │   (validated)    │
└─────────────────┘                    └────────┬─────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    ▼                           ▼                           ▼
           ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
           │ crates/storage  │         │ crates/domain   │         │ crates/security │
           │ (SQLite + FTS5) │         │ (validation)    │         │ (DPAPI, audit)  │
           └─────────────────┘         └─────────────────┘         └─────────────────┘
```

- **Nenhum comando shell genérico** exposto ao frontend ou LLM
- **Credenciais** apenas no Windows Credential Manager (DPAPI)
- **Dados sensíveis** nunca em logs, localStorage, telemetria
- **Prompt injection** mitigado: sanitização de HTML/Markdown, schemas fechados para tools

## IPC Contracts (packages/contracts)

```typescript
// Exemplo: criação de perfil de estudo
interface CreateStudyProfileInput {
  name: string;
  goal: string;           // livre, exame, concurso, etc.
  institution?: string;
  exam?: string;
  timezone: string;       // IANA
}

interface CreateStudyProfileOutput {
  id: string;             // UUID v7
  createdAt: string;      // ISO 8601 UTC
}
```

## Migrações de Banco

- Versionadas em `crates/storage/migrations/`
- Numeradas sequencialmente (001, 002, ...)
- Cada migração: `up.sql` + `down.sql` (testável)
- Aplicadas na inicialização; lock de migração

## Convenções

- **IDs:** UUID v7 (timestamp + random) — ordenáveis, únicos
- **Timestamps:** UTC ISO 8601 no banco; conversão para TZ do usuário na UI
- **Hashes:** SHA-256 hex para documentos (deduplicação)
- **Erros:** `Result<T, AppError>` com códigos estáveis (`STORAGE_*`, `VALIDATION_*`, `AUTH_*`, `AI_*`)
- **Logs:** `tracing` crate; nível configurável; sem dados sensíveis

## Performance Targets (baseline Fase 1)

| Métrica | Alvo |
|---------|------|
| Cold start (app → UI interativa) | < 2s |
| DB query simples (perfil) | < 10ms |
| Busca FTS5 (10k docs) | < 100ms |
| Tamanho instalador NSIS | < 80 MB |
| Memória ociosa | < 150 MB |

---

*Atualizado a cada ADR novo ou mudança estrutural.*