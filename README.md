# PRISMA + LIA

**Aplicativo desktop acadêmico completo, pessoal, gratuito e local-first para Windows.**

Assistente **LIA (Laboratório de Inteligência Acadêmica)** integrada, com 24 módulos obrigatórios desenvolvidos em seis fases.

## Visão Geral

| Atributo | Valor |
|----------|-------|
| **Aplicativo** | PRISMA |
| **Assistente** | LIA |
| **SO** | Windows (desktop nativo, instalador NSIS) |
| **Stack** | Tauri 2 + Rust + React/TypeScript + SQLite |
| **IA** | Nemotron 3 Ultra via NVIDIA (chave própria do usuário) |
| **Idioma** | Português brasileiro (pt-BR) |
| **Custo operacional** | R$ 0,00 |
| **Licença** | Open source (MIT/Apache-2.0) |

## 24 Módulos Obrigatórios

### Aprendizagem (M01–M05)
- **M01 Learn** — Tutor e trilhas com pré-requisitos
- **M02 Atlas** — Grafo de conhecimento interativo
- **M03 Error Lab** — Caderno de erros com hipóteses de causa
- **M04 Recall** — Repetição espaçada (FSRS)
- **M05 Focus** — Pomodoro e concentração

### Avaliação (M06–M09)
- **M06 Exams** — Provas e simulados com integridade
- **M07 Questions** — Banco de questões versionado
- **M08 Exam Intelligence** — Estatísticas de provas auditáveis
- **M09 Forecast** — Prontidão com intervalos de incerteza

### Conhecimento (M10–M14)
- **M10 Reader** — Leitor PDF com OCR e anotações
- **M11 Library** — Biblioteca híbrida (local + fontes oficiais)
- **M12 Search** — Busca universal FTS5
- **M13 Compare** — Comparações de editais/respostas
- **M14 Formula** — Matemática simbólica (SymPy sidecar)

### Produtividade (M15–M18)
- **M15 Planner** — Calendário com replanejamento determinístico
- **M16 Projects** — Kanban, entregáveis, anexos
- **M17 School** — Gestão escolar (notas, médias, frequência)
- **M18 Dashboard** — Visão consolidada derivada dos módulos

### Produção (M19–M22)
- **M19 Studio** — Criação DOCX/PPTX/PDF/Markdown
- **M20 Board** — Quadro visual (desenhos, diagramas)
- **M21 Lab** — Experimentos controlados
- **M22 Oral** — Banca oral com rubricas

### Inteligência (M23–M24)
- **M23 LIA** — Assistente contextual com ferramentas tipadas
- **M24 Active Learning** — Orquestração pedagógica baseada em evidência

## Seis Fases de Execução

1. **Fase 1 — PRISMA Foundation** ← *atual*
2. Fase 2 — PRISMA Academic
3. Fase 3 — PRISMA Learning
4. Fase 4 — PRISMA Intelligence
5. Fase 5 — PRISMA Studio & Advanced
6. Fase 6 — PRISMA Stable (instalador NSIS funcional)

## Documentação Obrigatória

- `ARCHITECTURE.md` — Decisões arquiteturais e ADRs
- `SPEC.md` — Especificação funcional detalhada
- `DATA_MODEL.md` — Modelo de dados unificado
- `SECURITY.md` — Políticas de segurança e privacidade
- `SOURCE_POLICY.md` — Política de evidência e fontes
- `TEST_PLAN.md` — Plano de testes por fase
- `ROADMAP.md` — Cronograma e marcos
- `CHANGELOG.md` — Histórico de mudanças
- `IMPLEMENTATION_STATUS.md` — Status real de implementação
- `RUNBOOK.md` — Operação e diagnóstico
- `THIRD_PARTY_LICENSES.md` — Licenças de terceiros

## Início Rápido (após build)

```bash
# Pré-requisitos: Rust stable, Node.js 20+, Visual Studio Build Tools
cd apps/desktop
cargo tauri dev          # Desenvolvimento
cargo tauri build        # Build de produção (gera .exe NSIS)
```

## Status da Implementação

Consulte `IMPLEMENTATION_STATUS.md` para o estado real de cada módulo, fase e testes.

---

**Desenvolvido com autonomia, engenharia rigorosa e foco na integridade dos dados acadêmicos.**