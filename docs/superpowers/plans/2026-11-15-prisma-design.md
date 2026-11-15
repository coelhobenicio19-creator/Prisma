# PRISMA — implementação do design aprovado

Autorização: proposta aprovada pelo usuário em 15/11/2026, com reforço para landing animada, 3D e Atlas. Execução nativa contínua neste chat.

## Estrutura
- `src/styles/refinement.css`: tokens e acabamentos compartilhados em web e desktop.
- `src/components/layout/AppHeader.tsx`, `Sidebar.tsx`: navegação agrupada, busca real, tema e contexto.
- `src/components/Constellation3D.tsx`: hero espacial em canvas com órbitas, conexões e movimento reduzido.
- `src/pages/Landing.tsx`, `src/styles/landing.css`: apresentação editorial animada com acesso real.
- `src/components/Atlas3DGraph.tsx`: grafo, controles e seleção acessível.
- `src/utils/atlas-view.ts` e testes: filtros e relações consistentes.
- `src/pages/AtlasHub.tsx`: mapa, filtros, listas e painel contextual preservando APIs.
- `src/pages/Dashboard.tsx`: próxima ação e hierarquia de informações reais.
- Demais páginas: revisão de cabeçalhos, formulários, estados e organização específica.
- Desktop: aplicar identidade e navegação comuns, manter funcionalidades e integrações Tauri próprias.

## Tarefas
1. Preservar fontes anteriores, registrar baseline, criar branch de design; não resetar mudanças locais.
2. Testar primeiro normalização de busca, filtro combinado, arestas visíveis e limites de zoom. Implementar utilitários puros.
3. Refinar estilos e componentes globais; cabeçalho com busca via rota e Ctrl+K, tema reativo, navegação agrupada; validar tipos.
4. Construir constelação com perspectiva real, órbitas e profundidade. Landing com hero, prévia interativa do Atlas, blocos LIA/Recall e formulário de login existente.
5. Reformular Atlas preservando dados reais, seis modos, criação e ações. Melhorar seleção, controles e feedback; lista acessível alternativa ao mapa.
6. Reformular início com próxima ação e métricas reais; revisar demais módulos individualmente.
7. Aplicar linguagem visual ao desktop sem transportar APIs web. Validar builds separadamente.
8. Executar testes, builds, checagem visual em 390/768/1440 px e fluxos com dados simulados explicitamente em ambiente de teste; uma revisão independente final e correção de problemas relevantes.

## Validação
Baseline web: `npm run test:unit`, `npm run build`. Final: repetir, executar build desktop e checagem visual em navegador com fonte local. Verificar login, tema, busca, controles de grafo, filtros e atalhos. Não fazer deploy.

## Ledger
- Ruling: trabalhar na pasta original em branch `design/prisma-graphite`, com cópia completa das fontes web/desktop em `work/prisma-before` no chat — pedido explícito para começar a alterar e necessidade de preservar as edições atuais da landing.
- Ruling: prosseguir sem nova aprovação de plano — usuário aprovou o documento e autorizou começar as alterações.
- Ruling: não criar testes que apenas espelham estilos/CSS; utilizar testes para filtros e limites e validação visual para composição, conforme instruções do ambiente.

- Baseline web confirmado: 67 testes e build aprovados.
- Testes de comportamento adicionados: filtros/arestas/zoom, centralização de disciplina isolada, entrada sem sessão, erro de login, composição Slot de links, rótulos externos de Input, alternância de tema, controles de voz e contrato SSE/histórico LIA. As regressões foram observadas antes de corrigidas.
- Revisão independente final: três Important, todos confirmados e corrigidos (envio involuntário por controles de voz; rota do histórico LIA; erros SSE e respostas vazias). Parser SSE também preserva eventos divididos entre pacotes.
- Suíte web: 83/83 testes aprovados na execução final de comportamento.
- Ruling: NativeAtlas usa somente tópicos expostos pelo dashboard nativo; não cria tópicos, evidências ou pré-requisitos fictícios e não transfere APIs web para Tauri.
- Ruling: manter alterações locais na branch de design, sem commit agregado das alterações anteriores do usuário, sem merge/push/deploy.
- Ruling: não gerar instalador Windows nesta reformulação; validar frontend desktop e declarar a limitação de teste nativo na entrega.
- Conclusão: builds finais web e frontend desktop aprovados; QA em 43 combinações aprovado sem erros de execução ou overflow. Nove grupos de fluxos verificados; temas claro/escuro e movimento reduzido incluídos. Ajuste final de zoom por Ctrl+roda verificado no navegador. Prévias e relatório entregues na pasta outputs do chat.
