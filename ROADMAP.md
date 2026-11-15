# Roadmap — PRISMA + LIA

## Visão de Longo Prazo

Aplicativo desktop acadêmico completo, pessoal, gratuito, local-first para Windows. 24 módulos em 6 fases. Custo operacional R$ 0,00.

---

## Fase 1 — PRISMA Foundation (Atual)
**Objetivo:** App desktop real abrindo no Windows, persistência local, navegação, onboarding, Library/Search/Dashboard iniciais, build + instalador teste.

| Épico | Tarefas Principais | Status |
|-------|-------------------|--------|
| **Workspace & Toolchain** | Estrutura de dirs, docs base, Rust/Node/Build Tools instalados | 🟡 Parcial (docs ✅, Rust ❌) |
| **Tauri 2 App** | `cargo tauri init`, config, allowlist, ícone, splash | ⏳ Pendente |
| **Design System** | Tokens Graphite Academic, componentes base (Button, Card, Input, Sidebar, Panel), tema claro/escuro | ⏳ Pendente |
| **Navegação & Shell** | Sidebar compacta, área central, painel LIA (colapsável), roteamento, busca global (Ctrl+K) | ⏳ Pendente |
| **Onboarding Universal** | Wizard: perfil, fuso, telemetria (OFF), chave API (opcional), objetivo livre | ⏳ Pendente |
| **SQLite & Migrações** | `crates/storage`: conexão, migrações 001/002, repositórios base, FTS5 | ⏳ Pendente |
| **Settings & Backup** | Configurações persistidas, backup/restauração local, exportação JSON/CSV | ⏳ Pendente |
| **Library Inicial (M11)** | Importar arquivo local, hash SHA-256, listar, abrir, deletar, deduplicação | ⏳ Pendente |
| **Search Textual Inicial (M12)** | FTS5 sobre documentos, resultados com link para abrir | ⏳ Pendente |
| **Dashboard Inicial (M18)** | Cards: próximos compromissos, revisões pendentes, estatísticas básicas | ⏳ Pendente |
| **Task Manager & Logs** | Gerenciador de tarefas async, logs estruturados (tracing), diagnóstico | ⏳ Pendente |
| **Build & Installer Test** | `cargo tauri build`, NSIS `.exe` gerado, smoke test em VM/perfil limpo | ⏳ Pendente |

**Gate Fase 1:** App abre no Windows, cria/reabre dados, build passa, instalador de teste funcional.

---

## Fase 2 — PRISMA Academic
**Objetivo:** Pipeline rastreável PDF→página→tópico→questão→estatística; fontes oficiais verificáveis; fixtures de extração.

| Épico | Tarefas Principais | Dependência |
|-------|-------------------|-------------|
| **Metas & Perfis Universais** | CRUD perfis, tipos de objetivo, instituições, exames, edições | Fase 1 |
| **Disciplinas & Atlas Base** | Subject, Topic, PrerequisiteEdge, Skill, visualização grafo (cytoscape/canvas) | Fase 1 |
| **Fontes Oficiais & PDFs** | Source/SourceVersion, download oficial, hash, versionamento, Compare (M13) | Fase 1 |
| **OCR com Revisão** | Sidecar Python (pdfplumber + tesseract), flag `needs_review`, UI de correção | Fase 1 + Python |
| **Reader Inicial (M10)** | PDF.js viewer, zoom, busca, destaque, notas, extração texto | Fase 1 |
| **Questions (M07)** | CRUD questões, tipos, metadados, origem, versionamento, importação CSV/JSON | Fase 1 |
| **Exam Intelligence (M08)** | Incidência por tópico, evolução anual, pesos, recálculo auditável, aviso amostra | Fase 2 |
| **Compare (M13)** | Diff textual/semântico entre 2 versões/fontes, marcações, citações | Fase 2 |

**Gate Fase 2:** Pipeline PDF→página→tópico→questão→estatística rastreável; nenhuma ref oficial sem origem.

---

## Fase 3 — PRISMA Learning
**Objetivo:** Jornada end-to-end avaliação→erro→revisão→cronograma com persistência offline; cronômetro testado; médias e FSRS verificados.

| Épico | Tarefas Principais | Dependência |
|-------|-------------------|-------------|
| **Exams Completo (M06)** | Máquina de estados, relógio monotônico, autosave, recovery, modos Treino/Exame, integridade | Fase 2 |
| **Learn (M01)** | Trilhas, pré-requisitos, lições escalonadas, prática guiada, progresso persistido | Fase 2 |
| **Atlas Completo (M02)** | Domínio derivado de evidências, ligação bidirecional, edição de relações auditada | Fase 2 |
| **Error Lab (M03)** | Registro automático, hipóteses de causa, confirmação, reincidência, estratégias | Fase 2 |
| **Recall FSRS (M04)** | Flashcards multi-tipo, FSRS (crate `fsrs`), decks, estatísticas, exportação Anki | Fase 2 |
| **Focus (M05)** | Pomodoro, timer monotônico, metas, sons, logs, modo redução distrações | Fase 1 |
| **Planner (M15)** | Calendário, prioridades determinísticas com justificativa, replanejamento, rotinas | Fase 1 |
| **Projects (M16)** | Kanban, entregáveis, anexos, checklist, relações Atlas/Library | Fase 1 |
| **School (M17)** | Períodos, matérias, avaliações, pesos, médias recalculáveis, lembretes | Fase 1 |
| **Dashboard Completo (M18)** | Visão consolidada derivada de todos módulos, sugestões LIA placeholder | Fase 3 |
| **Forecast Inicial (M09)** | Cobertura, domínio, retenção, simulados, tempo, cenários com incerteza | Fase 3 |
| **Gamificação Configurável** | Metas, conquistas, sequências, desabilitável, sem dark patterns | Fase 3 |

**Gate Fase 3:** Jornada avaliação→erro→revisão→cronograma offline completa; cronômetro e FSRS testados.

---

## Fase 4 — PRISMA Intelligence
**Objetivo:** LIA real com Nemotron, tools autorizadas, RAG, política de evidência, Active Learning, diagnósticos.

| Épico | Tarefas Principais | Dependência |
|-------|-------------------|-------------|
| **Adaptador NVIDIA Nemotron** | OpenAI-compatible, timeout, retry+jitter, 429/503, cancelamento, budget, cache, logs | Fase 1 (chave) |
| **LIA Core (M23)** | Conversa, memória opt-in, modo adaptativo, citações, incerteza, tools schemas | Fase 3 |
| **Tools da LIA** | `create_plan`, `draft_exam`, `draft_cards`, `summarize_source`, `generate_presentation`, `compare_sources` | Fase 4 |
| **RAG Controlado** | Busca local (FTS5 + opcional embeddings), trechos preservados, declaração de falta de fonte | Fase 2 |
| **Política de Evidência** | Integração com SOURCE_POLICY, validação de citações, bloqueio `unverified` | Fase 2 |
| **Active Learning (M24)** | Recomendações com evidência, priorização explicável, ciclos fechar-aprender-avaliar-replanejar | Fase 3 |
| **Proteção Prompt Injection** | Sanitização entrada, schemas fechados, detecção padrões suspeitos, logs | Fase 4 |
| **Controles de API** | Status bar (disponível/limitado/offline), redução contexto, deduplicação, feedback | Fase 4 |
| **Autorização & Diagnósticos** | Approval para ações sensíveis, idempotência, rollback, auditoria completa | Fase 4 |

**Gate Fase 4:** Interações reais autorizadas; testes de citações, falha API, privacidade, integridade.

---

## Fase 5 — PRISMA Studio & Advanced
**Objetivo:** Arquivos gerados abrem/validam; matemática testada; leitura contextual; voz opt-in; produção acadêmica fundamentada; experiências offline válidas.

| Épico | Tarefas Principais | Dependência |
|-------|-------------------|-------------|
| **Studio (M19)** | DOCX (docx-rs), PPTX (pptx-rs), PDF (printpdf), Markdown, templates ABNT, citações verificáveis | Fase 4 |
| **Board (M20)** | Canvas desenho, diagramas, fórmulas, undo/redo, export PNG/SVG/PDF, referências Atlas | Fase 4 |
| **Lab (M21)** | Hipótese/método/dados/gráficos, sidecar Python controlado (timeout, mem, IPC), relatórios | Fase 4 + Python |
| **Formula (M14)** | Banco fórmulas, SymPy sidecar, unidades, verificações determinísticas, gráficos | Fase 4 + Python |
| **Oral (M22)** | Perguntas voz/texto, STT/TTS local (faster-whisper/Piper), rubricas, feedback, transcrição editável | Fase 4 + Voice |
| **Voz STT/TTS** | Push-to-talk, indicador visual, opt-in keyword, zero gravação oculta, fallback texto | Fase 5 |
| **Reader Completo (M10)** | EPUB se viável, OCR revisado, anotações avançadas, LIA sobre seleção | Fase 2 |
| **Forecast Expandido (M09)** | Calibração histórica, explicação indicadores, cenários refinados | Fase 3 |
| **Acessibilidade** | Teclado completo, foco visível, contraste WCAG AA, screen reader básico, i18n keys | Fase 5 |

**Gate Fase 5:** Arquivos gerados abrem; matemática passa; voz opt-in; produção fundamentada; offline válido.

---

## Fase 6 — PRISMA Stable
**Objetivo:** Instalador NSIS funcional verificado no Windows; zero falhas críticas abertas; documentação completa.

| Épico | Tarefas Principais | Dependência |
|-------|-------------------|-------------|
| **Revisão de Segurança** | Allowlist audit, credential manager, sanitização, prompt injection, telemetria OFF | Todas |
| **Testes de Regressão/Recuperação** | Cenários 1-16 executados, crash recovery, clock change, disk full, network loss | Fase 5 |
| **Perfis de Performance** | Cold start, memory, DB queries, bundle size, startup profiling | Fase 5 |
| **UX/Acessibilidade Final** | Polish, animações sutis, empty/loading/error states, keyboard nav, contrast | Fase 5 |
| **Licenças & THIRD_PARTY_LICENSES** | Cargo-deny, license-checker, todos MIT/Apache/BSD, zero GPL no core | Todas |
| **Documentação Final** | README, ARCHITECTURE, SPEC, DATA_MODEL, SECURITY, SOURCE_POLICY, TEST_PLAN, RUNBOOK | Todas |
| **Validação Backup** | Cenário 14 automatizado, restore testado em CI | Fase 1 |
| **Teste Windows Limpo** | VM/perfil novo → instalador → onboarding → usar → desinstalar → preservar dados | Fase 6 |
| **NSIS .exe Final** | Ícone, atalho, desinstalador, WebView2 bootstrapper, checksum SHA-256, assinatura (futuro) | Fase 6 |
| **Relatório Final** | Changelog, known issues, migration guide, installation instructions | Fase 6 |

**Gate Fase 6:** Instalador funcional verificado; zero falhas críticas; se ambiente impede teste → `bloqueado/sem validação`.

---

## Marcos de Decisão (Go/No-Go)

| Marco | Critério | Ação se Falhar |
|-------|----------|----------------|
| **Fim Fase 1** | Tauri app abre, SQLite persiste, build passa | Reavaliar stack; não avançar |
| **Fim Fase 2** | Pipeline PDF→estatística rastreável | Corrigir extração/OCR; não avançar |
| **Fim Fase 3** | Jornada offline completa passa | Simplificar escopo; não avançar |
| **Fim Fase 4** | LIA real autorizada, sem operações irrestritas | Revisar arquitetura tools; não avançar |
| **Fim Fase 5** | Studio/Formula/Voz funcionais offline | Cortar features não essenciais |
| **Fim Fase 6** | Instalador verificado em Windows limpo | Documentar bloqueios; release `beta` |

---

## Riscos Conhecidos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Rust/Build Tools não instalam | Alta | Bloqueia Fase 1 | Tentar múltiplos métodos; documentar instalação manual |
| NVIDIA API muda/encerra | Média | Bloqueia Fase 4 | Adaptador genérico OpenAI; fallback offline; documentar |
| Sidecar Python muito grande | Média | Tamanho installer | Avaliar alternativas Rust (egui, math); compilar minimal |
| WebView2 ausente no Windows | Baixa | Instalador falha | Bootstrapper NSIS incluído; testar em VM limpa |
| FSRS crate não mantido | Baixa | Recall quebrado | Implementar SM-2 fallback; fork se necessário |
| OCR quality baixa | Média | M10/M11 prejudicados | Flag `needs_review` obrigatório; UX de correção fluida |
| Prompt injection via PDF | Baixa | Segurança | Sanitização rigorosa; testes Cenário 9; allowlist mínima |

---

## Estimativas de Esforço (Relative)

| Fase | Semanas (1 dev) | Complexidade |
|------|-----------------|--------------|
| 1 | 3-4 | Foundation |
| 2 | 4-5 | Academic core |
| 3 | 5-6 | Learning loop |
| 4 | 4-5 | Intelligence |
| 5 | 5-6 | Advanced features |
| 6 | 2-3 | Polish & ship |
| **Total** | **23-29** | **~6-7 meses** |

*Estimativas aproximadas; ajustar conforme velocity real e bloqueios.*

---

*Atualizado a cada fase. Ver `IMPLEMENTATION_STATUS.md` para estado real.*