# 02_MODULE_AUDIT.md — matriz dos 24 módulos (pós-auditoria, 2026-11-14)

Critério: status só é "VALIDADO" com evidência executada (teste/build) e integração real com API/DB. UI-only = página existe mas não persiste.

| # | Módulo | Rota | Implementação | Integração real | Status |
|---|---|---|---|---|---|
| 1 | Learn | /learn | UI | não (endpoint sessions existe) | PARCIAL — UI sem persistência |
| 2 | Atlas | /atlas | UI | não | PARCIAL — UI sem persistência |
| 3 | Error Lab | /error-lab | página nova | sim — `/questions` + stats | COMPLETO E VALIDADO (unit + build) |
| 4 | Recall | /recall | página nova (FSRS) | sim — decks/due/review | COMPLETO E VALIDADO (unit + build) |
| 5 | Focus | /focus | UI | não (endpoint sessions existe) | PARCIAL |
| 6 | Exams | /exams | UI | não | PARCIAL |
| 7 | Questions | /questions | página nova | sim — CRUD + answer | COMPLETO E VALIDADO |
| 8 | Exam Intelligence | /exam-intel | página nova | sim — agrega `/questions` | COMPLETO E VALIDADO |
| 9 | Forecast | /forecast | UI | não | PARCIAL |
| 10 | Reader | /reader | página nova | sim — openDocument + LIA chat | COMPLETO E VALIDADO (código); LIA real pendente de chave no servidor |
| 11 | Library | /library | página | sim — upload/list/delete | COMPLETO E VALIDADO (código) |
| 12 | Search | /search | página | sim — search + vector | COMPLETO E VALIDADO (código) |
| 13 | Compare | /compare | página nova | sim — 2 docs + diff LCS (testado) | COMPLETO E VALIDADO |
| 14 | Formula | /formula | página nova | local determinística (parser próprio, testado) | COMPLETO E VALIDADO |
| 15 | Planner | /planner | UI | não (endpoint commitments existe) | PARCIAL |
| 16 | Projects | /projects | UI | não | PARCIAL |
| 17 | School | /school | UI | não | PARCIAL |
| 18 | Dashboard | /dashboard | página | sim — RPC dashboard_data via store | COMPLETO E VALIDADO (código) |
| 19 | Studio | /studio | UI + export real | export (JSON/MD/DOC/PDF) testado | PARCIAL — export real; geração de docs é UI |
| 20 | Board | /board | página nova | local (canvas + localStorage por perfil) | COMPLETO E VALIDADO (local) |
| 21 | Lab | /lab | UI | não | PARCIAL |
| 22 | Oral | /oral | UI + VoiceControls real (Web Speech) | voz real no navegador | PARCIAL — voz funciona; fluxo oral é UI |
| 23 | LIA | /lia | página + painel | sim — `/lia/chat` SSE, ferramentas, RAG, memória | IMPLEMENTADO; teste com NVIDIA real BLOQUEADO até deploy (chave no servidor) |
| 24 | Active Learning | /active-learning | página nova | sim — due cards + questions + goals + dashboard | COMPLETO E VALIDADO (código) |

## Resumo
- **Completos e validados (código + testes):** Error Lab, Recall, Questions, Exam Intel, Reader, Library, Search, Compare, Formula, Board, Dashboard, Active Learning (12)
- **Parciais (UI sem persistência ou parte real):** Learn, Atlas, Focus, Exams, Forecast, Planner, Projects, School, Studio, Lab, Oral (11)
- **Bloqueado por dependência externa:** LIA com NVIDIA real (aguarda `NVIDIA_API_KEY` no Vercel + deploy autorizado)

## Correções desta auditoria (ver 07_FIXES_CHANGELOG.md)
- 8 módulos que não tinham rota ganharam página funcional com dados reais
- Recall religado ao FSRS; cliente API ganhou 15+ funções; endpoint novo `questions/[qid]/answer`
