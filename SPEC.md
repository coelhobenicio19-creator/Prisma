# Especificação Funcional — PRISMA + LIA v1.0

## 1. Escopo do Produto

Aplicativo desktop Windows para gestão completa da vida acadêmica: planejamento, estudo, avaliação, produção de conhecimento e assistência inteligente (LIA). 24 módulos obrigatórios, 6 fases de entrega, custo operacional zero.

## 2. Personas e Casos de Uso Principais

| Persona | Objetivo Principal | Módulos-Chave |
|---------|-------------------|---------------|
| **Vestibulando** | Aprovação em ENEM/vestibular | M06, M07, M08, M09, M04, M15 |
| **Concurseiro** | Aprovação em concurso público | M06, M07, M08, M03, M04, M15 |
| **Estudante Graduação** | Organização, notas, projetos | M15, M16, M17, M18, M19 |
| **Autodidata** | Trilhas livres, retenção | M01, M02, M04, M05, M23 |
| **Pesquisador** | Biblioteca, comparações, produção | M10, M11, M12, M13, M19, M21 |

## 3. Requisitos Funcionais por Módulo (Resumo)

### M01 Learn — Tutor e Trilhas
- **RF01.1** Criar trilha do zero: nome, objetivo, nível inicial, prazo alvo
- **RF01.2** Associar fontes (PDFs, URLs oficiais, arquivos) a tópicos da trilha
- **RF01.3** Lições com explicação escalonada (visão geral → detalhes → prática)
- **RF01.4** Prática guiada com exercícios e feedback imediato
- **RF01.5** Registro de progresso por tópico (%, tempo, última revisão)
- **RF01.6** Retomada exata do ponto de parada após reinício do app

### M02 Atlas — Grafo de Conhecimento
- **RF02.1** Nós: tópicos, habilidades, pré-requisitos (arestas direcionadas)
- **RF02.2** Visualização interativa (zoom, pan, busca, filtros por disciplina)
- **RF02.3** Níveis de domínio derivados de evidências (M03, M04, M06, M07)
- **RF02.4** Ligação bidirecional: tópico ↔ questões ↔ materiais ↔ resumos
- **RF02.5** Edição de relações (adicionar/remover pré-requisito) com auditoria

### M03 Error Lab — Caderno de Erros
- **RF03.1** Registro automático ao errar questão em M06/M07 (contexto: prova, tópico, tempo, alternativa)
- **RF03.2** Hipótese de causa: conceito / cálculo / interpretação / pressa / esquecimento / outro
- **RF03.3** Confirmação manual da causa (obrigatória antes de estatísticas)
- **RF03.4** Detecção de reincidência (mesmo tópico, causa similar)
- **RF03.5** Estratégias de recuperação vinculadas (flashcard M04, revisão M01, questão similar M07)
- **RF03.6** Reclassificação auditável (histórico de mudanças de causa)

### M04 Recall — Repetição Espaçada
- **RF04.1** Flashcards: texto, imagem (base64/local), equação (LaTeX/KaTeX)
- **RF04.2** Criação manual + assistida por LIA (M23) a partir de fonte/erro
- **RF04.3** Algoritmo FSRS (parâmetros ajustáveis, reset por deck)
- **RF04.4** Datas de revisão, histórico de notas (Again/Hard/Good/Easy), estatísticas de retenção
- **RF04.5** Categorias (deck por disciplina, prova, erro, manual)
- **RF04.6** Exportação/importação (CSV, JSON, Anki-compatível)
- **RF04.7** Persistência total entre reinícios; cards vinculados a fontes (M11)

### M05 Focus — Concentração
- **RF05.1** Pomodoro configurável (trabalho/pausa longa/curta, ciclos)
- **RF05.2** Timer monotônico (não afetado por mudança de relógio do sistema)
- **RF05.3** Metas de sessão (ex.: "3 blocos de Física"), pausas obrigatórias/opcionais
- **RF05.4** Som opcional (fim de bloco, pausa); logs de sessão (início, fim, interrupções)
- **RF05.5** Suspensão/retomada (pausa real, não reset)
- **RF05.6** Modo "redução voluntária de distrações" (esconder UI não essencial, fullscreen)
- **RF05.7** Sem monitoramento de câmera, teclado global, biometria

### M06 Exams — Provas e Simulados
- **RF06.1** Perfis universais (livre, ENEM, concurso X, vestibular Y, olimpíada, disciplina)
- **RF06.2** Provas: oficiais (importadas), autorais, geradas por LIA — todas com origem clara
- **RF06.3** Configuração: duração, instruções, modo Treino (com dicas/LIA) vs Exame (sem)
- **RF06.4** Tentativas com autosave contínuo (cada resposta salva)
- **RF06.5** Banco de eventos (navegação, foco, tempo, ações) para integridade
- **RF06.6** Correção automática (objetivas) + rubrica (discursivas) + revisão pós-prova
- **RF06.7** Máquina de estados: `draft → ready → running ↔ interrupted → submitted → scored → reviewed`
- **RF06.8** Recuperação após crash: journal + snapshot + reconciliação de tempo monotônico
- **RF06.9** Persistência de tentativa ao fechar/reabrir; prazo não reinicia indevidamente

### M07 Questions — Banco de Questões
- **RF07.1** Enunciado rico (Markdown, LaTeX, imagens, tabelas)
- **RF07.2** Tipos: múltipla escolha, múltipla resposta, discursiva, numérica, ordenação, associação
- **RF07.3** Metadados: dificuldade (1-5), fonte, ano, edição, número, tags, disciplina, tópico (Atlas)
- **RF07.4** Gabarito oficial + comentários; divergência visível se houver
- **RF07.5** Origem: `oficial` / `importada` / `gerada_ia` / `autorais` — nunca misturadas
- **RF07.6** Busca, filtros, importação (PDF/CSV/JSON), revisão de questões IA antes de usar em avaliação formal
- **RF07.7** Versionamento de enunciado/gabarito (histórico imutável)

### M08 Exam Intelligence — Estatística de Provas
- **RF08.1** Edição da prova, conteúdos do edital, classificação de questões por tópico (Atlas)
- **RF08.2** Incidência histórica por tópico/disciplina (contagem, %, denominador, anos)
- **RF08.3** Amostra, evolução por ano, comparação de editais, pesos oficiais
- **RF08.4** Detecção de inconsistências (gabaritos divergentes, questões anuladas)
- **RF08.5** Toda estatística recalculável a partir de questões verificadas; aviso para amostras pequenas (n<30)

### M09 Forecast — Prontidão
- **RF09.1** Estimativa de cobertura (tópicos do edital vs estudados), domínio (Atlas), retenção (M04), simulados (M06), tempo disponível
- **RF09.2** Cenários com intervalos de incerteza (pessimista/realista/otimista)
- **RF09.3** Histórico de calibração (previsão vs real em simulados/provas passadas)
- **RF09.4** Explicação de cada indicador (fórmula, fontes, limitações)
- **RF09.5** Ausência de dados → "insuficiente", nunca valor inventado

### M10 Reader — Leitor
- **RF10.1** PDF: zoom, rotação, miniaturas, marcadores, busca textual, navegação por outline
- **RF10.2** Destaques (cores), notas por página/trecho, exportação de anotações
- **RF10.3** Extração de texto + OCR para scans (Tesseract/PDF.js + revisão de trechos incertos)
- **RF10.4** Perguntas à LIA sobre seleção com citações de página/trecho
- **RF10.5** EPUB apenas se viável tecnicamente e licenciado (baixa prioridade)

### M11 Library — Biblioteca
- **RF11.1** Importação híbrida: arquivos locais (PDF, DOCX, PPTX, TXT, MD, imagens) + URLs oficiais
- **RF11.2** Coleções (pastas virtuais), versionamento de arquivos, hashes SHA-256
- **RF11.3** Metadados: título, autores, ano, DOI, ISBN, tags, origem, credibilidade (auto/revisão)
- **RF11.4** Deduplicação por hash + metadados; revisão para colisões semânticas
- **RF11.5** Exportação de coleção (ZIP + manifest JSON); links oficiais verificáveis
- **RF11.6** Operação totalmente offline; recuperação de arquivos após reinício

### M12 Search — Busca Universal
- **RF12.1** FTS5 (SQLite) sobre: questões, documentos, edições, resumos, conversas LIA, tarefas, notas
- **RF12.2** Filtros: origem, disciplina, data, prova, status (verificado/precisa_revisão/gerado_ia)
- **RF12.3** Resultados com link direto ao trecho/objeto (abrir no módulo correspondente)
- **RF12.4** Atualização incremental do índice; funcionamento 100% offline
- **RF12.5** Busca semântica opcional (embeddings) apenas se viável com recursos gratuitos sem LLM local

### M13 Compare — Comparações
- **RF13.1** Dois editais/versões, duas respostas, dois textos, duas provas, dois documentos
- **RF13.2** Diff textual (linha a linha) + semântico (parágrafos, seções) com marcações
- **RF13.3** Citações de origem para cada diferença; comparações inferidas marcadas como "interpretação"
- **RF13.4** Rastreabilidade: não misturar versões no banco

### M14 Formula — Matemática
- **RF14.1** Banco de fórmulas: nome, expressão LaTeX, variáveis (nome, símbolo, unidade, domínio), pressupostos, validade, exemplos, gráficos
- **RF14.2** Cálculos simbólicos via SymPy (sidecar Python): derivadas, integrais, limites, sistemas, simplificação
- **RF14.3** Conversão de unidades (SI, CGS, imperiais) com validação dimensional
- **RF14.4** Verificações determinísticas (testes com resultados conhecidos)
- **RF14.5** Não inventar demonstrações; aproximação ≠ igualdade exata

### M15 Planner — Planejamento
- **RF15.1** Calendário com metas, datas, disponibilidade semanal, revisões (M04), prioridades determinísticas
- **RF15.2** Justificativa de prioridade (ex.: "próximo ao prazo + baixa retenção + alta incidência")
- **RF15.3** Reajuste de atividades perdidas (reagendar, compactar, estender) mantendo histórico
- **RF15.4** Modelos de rotina (semanal, quinzenal, bloco de estudo)
- **RF15.5** Integração interna: exames (M06), estudo (M01), revisões (M04), projetos (M16)
- **RF15.6** Não apagar tarefas concluídas; não criar conflitos silenciosos

### M16 Projects — Tarefas e Trabalhos
- **RF16.1** Quadro Kanban (colunas personalizáveis), etapas, entregáveis, prazos, anexos, checklist
- **RF16.2** Relações com matérias (M17), Atlas (M02), biblioteca (M11)
- **RF16.3** Fluxo completo: criar → executar → entregar (com versionamento de entregáveis)
- **RF16.4** Histórico auditável (quem fez o quê, quando, alterações)

### M17 School — Gestão Escolar
- **RF17.1** Matérias, períodos letivos, avaliações (provas, trabalhos), pesos, notas, médias
- **RF17.2** Metas por matéria/período; frequência apenas se fornecida pelo usuário
- **RF17.3** Médias recalculáveis com pesos e regras explícitas (fórmulas configuráveis)
- **RF17.4** Lembretes locais (prazos, provas); nunca inventar notas ou importar sem consentimento

### M18 Dashboard — Central
- **RF18.1** Visão consolidada: próximos compromissos, risco de atraso, revisões pendentes (M04), cobertura (M01/M02), evolução (M03/M06/M09), atividades favoritas
- **RF18.2** Sugestões da LIA (M24) baseadas em evidência
- **RF18.3** Todos os números derivam dos módulos; atualização automática após mudanças
- **RF18.4** Zero estatísticas fictícias; "sem dados" quando aplicável

### M19 Studio — Estúdio de Criação
- **RF19.1** Geração: resumos, fichamentos, mapas mentais, listas, apresentações PPTX, documentos DOCX, PDFs, Markdown
- **RF19.2** Citações e referências (ABNT configurável) somente se verificáveis
- **RF19.3** Modelos acadêmicos (artigo, relatório, TCC, slide, poster)
- **RF19.4** Exportação com prévia e validação de estrutura/texto
- **RF19.5** Impedir citação inventada (avisar se referência não existe na Library)

### M20 Board — Quadro Visual
- **RF20.1** Anotações manuscritas/desenhos (canvas), diagramas, fórmulas, quadros
- **RF20.2** Salvamento, exportação (PNG/SVG/PDF), referências a conteúdos (M02/M11)
- **RF20.3** Seleção para explicar via LIA (M23)
- **RF20.4** Desfazer/refazer, persistência, limites de reconhecimento de escrita

### M21 Lab — Laboratório
- **RF21.1** Pesquisa livre, experimentos (hipótese, método, dados, gráficos, arquivos)
- **RF21.2** Execução de cálculos/simulações estritamente controladas (sidecar Python, timeout, memória, IPC tipado)
- **RF21.3** Relatórios com diferenciação simulado vs observado
- **RF21.4** Experimento de exemplo reproduzível; sem execução de código arbitrário da LIA no sistema

### M22 Oral — Banca Oral
- **RF22.1** Perguntas em voz ou texto; resposta via microfone (STT) ou digitação
- **RF22.2** Rubricas transparentes (critérios, pesos, níveis), feedback justificado
- **RF22.3** Relatório de pontos fortes/fracos; transcrição verificável/editável
- **RF22.4** Voz opcional sem impedir uso por texto; histórico de sessões

### M23 LIA — Assistente Contextual
- **RF23.1** Nemotron 3 Ultra via adaptador NVIDIA (OpenAI-compatible) configurável pelo usuário
- **RF23.2** Conversa + memória acadêmica opt-in por espaço/objetivo (perfil, prova, projeto)
- **RF23.3** Modo adaptativo: explica, pergunta socrática, dica gradual, cria exercício, cita documentos, reconhece incerteza
- **RF23.4** Ferramentas tipadas (JSON schemas fechados): `create_plan`, `draft_exam`, `draft_cards`, `summarize_source`, `generate_presentation`, `compare_sources`
- **RF23.5** Aprovação humana para ações sensíveis; idempotência; rastreamento; rollback/undo
- **RF23.6** Nunca shell irrestrito; nunca SQL arbitrário; nunca PowerShell

### M24 Active Learning — Orquestração Pedagógica
- **RF24.1** Recomendações com evidência: erros (M03), tempo (M05/M06), retenção (M04), frequência observada, prazo
- **RF24.2** Priorização explicável (mostrar dados usados); propostas de revisão; ciclos fechar-aprender-avaliar-replanejar
- **RF24.3** Aceitação/recusa pelo usuário; alterações no banco geram reavaliação coerente
- **RF24.4** Não diagnosticar condições cognitivas ou emocionais

## 4. Requisitos Não-Funcionais

| Categoria | Requisito |
|-----------|-----------|
| **Desempenho** | Cold start < 2s; queries < 10ms; busca FTS5 10k docs < 100ms |
| **Memória** | Ocioso < 150 MB; pico < 500 MB |
| **Instalador** | NSIS .exe < 80 MB; per-user; WebView2 bootstrapper |
| **Offline** | 100% funcional sem internet (exceto LIA e fontes web) |
| **Privacidade** | Telemetria OFF por padrão; consentimento granular; zero tráfego não autorizado |
| **Segurança** | DPAPI para segredos; allowlist Tauri mínima; sanitização entrada; sem shell exposto |
| **Acessibilidade** | Teclado completo; foco visível; contraste WCAG AA; leitores de tela (básico) |
| **Internacionalização** | pt-BR nativo; arquitetura i18n (chaves, não strings hardcoded) |
| **Confiabilidade** | ACID SQLite; migrações testadas up/down; backup/restauração validados |
| **Manutenibilidade** | TypeScript strict; Rust clippy/deny warnings; testes por módulo; ADRs documentados |

## 5. Restrições Técnicas

- **SO alvo:** Windows 10/11 (x64)
- **Runtime:** WebView2 (sistema), Rust (MSVC), Node.js (build only)
- **IA:** Nemotron 3 Ultra via NVIDIA; chave própria do usuário; sem modelo local
- **Python:** Sidecar empacotado apenas para SymPy/OCR; limites estritos
- **Custo:** R$ 0,00 — apenas bibliotecas open source e serviços gratuitos
- **Licenças:** MIT/Apache-2.0/BSD preferidas; GPL evitada no core
- **Telemetria:** Sem backend → apenas diagnóstico local exportável

## 6. Critérios de Aceitação Globais (por Fase)

Ver `TEST_PLAN.md` para cenários detalhados. Resumo por fase:

| Fase | Gate Principal |
|------|----------------|
| 1 | App abre no Windows, cria/reabre dados, build + instalador teste |
| 2 | Pipeline PDF→página→tema→questão→estatística rastreável |
| 3 | Jornada avaliação→erro→revisão→cronograma offline completa |
| 4 | LIA real autorizada, citações, falha API, privacidade, integridade |
| 5 | Arquivos gerados abrem/validam; matemática testada; voz opt-in |
| 6 | Instalador NSIS funcional verificado; zero falhas críticas abertas |

---

*Esta especificação é a fonte de verdade para implementação. Mudanças requerem ADR e atualização de `CHANGELOG.md`.*