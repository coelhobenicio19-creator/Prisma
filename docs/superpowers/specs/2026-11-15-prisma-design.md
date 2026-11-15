# PRISMA — reformulação visual

Design aprovado pelo usuário • 15 de novembro de 2026

## Objetivo e direção escolhida

Reformular o Prisma para ter acabamento profissional, com prioridade para Atlas, apresentação pública e painel inicial. A direção escolhida pelo usuário é grafite e verde sálvia: sóbria e sofisticada.

O produto é um ambiente acadêmico pessoal com estudo, organização e assistência LIA. A interface deve ajudar a entender o que estudar, encontrar materiais e transformar conhecimento em prática. A qualidade será avaliada pela clareza da hierarquia, legibilidade, consistência entre módulos e facilidade de executar as tarefas existentes.

## Base examinada

Projeto encontrado em `C:\Users\charl\nanoMuse\PRISMA`.

Foram lidos os componentes de navegação e interface, estilos globais, rotas, landing, dashboard, AtlasHub, renderizador do grafo, documentação de design e estado do projeto. Há aplicações web e desktop separadas. A documentação mais recente indica migração para web. Como o pedido cobre todo o Prisma, a proposta inclui ambas: implementar primeiro na web ativa e aplicar o mesmo sistema visual às telas equivalentes do desktop, preservando suas integrações Tauri. A inspeção detalhada do desktop faz parte do levantamento anterior à implementação; não pressupor que suas APIs ou funcionalidades sejam iguais às da web.

Há alterações locais anteriores em Landing.tsx, Constellation3D.tsx, scripts de prévia e docs/design. Elas precisam ser preservadas. A documentação existente registra que um prisma decorativo foi rejeitado: manter a linguagem de constelação e conhecimento conectado.

Esta avaliação foi feita pelo código; a validação visual no navegador ainda precisa acontecer durante a implementação.

## Problemas encontrados

- A barra lateral apresenta 23 módulos em uma lista contínua, com pouca hierarquia entre atividades frequentes e ferramentas especializadas.
- O Atlas exibe seis botões de modo, quatro cartões estatísticos, formulário de criação, legenda e painel lateral permanente. O mapa compete com esses elementos.
- O grafo gira automaticamente e usa interações principalmente por ponteiro. Falta controle explícito de pausa, zoom e enquadramento, além de alternativa acessível.
- O início autenticado apresenta estatísticas antes de conduzir a uma tarefa principal. Uma tendência de domínio está escrita como `+5% esta semana`, sem cálculo real naquele componente.
- A landing mistura apresentação, demonstrações e autenticação em uma experiência longa. Existem afirmações de privacidade e funcionamento que precisam ser conferidas antes de serem mantidas na nova redação.
- Os componentes compartilhados já oferecem uma boa base técnica, mas a hierarquia visual pode ser refinada para dar consistência às telas.

## Abordagens consideradas

1. **Grafite e sálvia, escolhida:** evolui a identidade existente, com hierarquia editorial, superfícies discretas e Atlas em destaque. Exige melhorar composição e interação, sem trocar toda a linguagem visual.
2. **Claro e editorial:** favorece leitura prolongada, mas muda a aparência predominante do produto. Poderá existir como tema coerente, sem orientar a composição principal.
3. **Escuro e imersivo:** dá maior presença a animações e efeitos, mas aumenta distração e custo de desempenho. Usar movimento apenas para explicar relações e estados.

## Sistema visual proposto

As decisões abaixo são recomendações de design do assistente, dentro da direção escolhida.

- Fundo grafite profundo, superfícies levemente elevadas e texto marfim. Verde sálvia reservado para ação principal, seleção e progresso.
- Reutilizar Inter e JetBrains Mono, com títulos mais expressivos e dados numéricos alinhados. Evitar novas dependências de fontes externas.
- Espaçamento em escala de 4/8 pixels, grupos claramente separados e larguras de leitura controladas. Formulários e conteúdo denso mantêm tamanho de texto confortável.
- Bordas sutis, sombras contidas e raios consistentes. Evitar transformar toda informação em cartão.
- Uma ação principal por contexto. Ações secundárias discretas; destrutivas separadas das ações de estudo.
- Ícones Lucide consistentes, rótulos em português e nenhuma mistura de emojis com ícones de interface.
- Estados de carregamento, vazio, erro, sucesso, seleção, foco e indisponibilidade com a mesma linguagem em todos os módulos.
- Tema claro compatível com os mesmos componentes e contraste verificado. Corrigir a aplicação do tema caso a inspeção confirme inconsistência entre a classe aplicada e os tokens existentes.

## Navegação e estrutura comum

Organizar a barra lateral em quatro grupos: Visão geral; Estudar; Conhecimento; Organizar e criar. Manter todas as rotas e ferramentas existentes acessíveis, com Atlas e LIA em posições fáceis de encontrar. Grupos podem recolher; a navegação recolhida precisa oferecer nomes acessíveis e dicas de contexto.

O cabeçalho deve identificar a tela e oferecer busca funcional com comportamento coerente com o atalho anunciado. Perfil, ajuda e preferências ficam em posições consistentes. A LIA deve ocupar um painel contextual recolhível, sem comprimir permanentemente o conteúdo.

Em telas menores, navegação em gaveta e ferramentas em painéis sobrepostos. Conteúdo principal não deve exigir rolagem horizontal.

## Atlas — prioridade principal

O mapa ocupa a maior área disponível. Cabeçalho compacto com título, resumo de progresso e ação “Adicionar conteúdo”. Busca por tópico, filtro por disciplina e seletor de visualização ficam numa barra própria. A criação de tópicos sai do espaço permanente do mapa e passa para um painel ou diálogo com rótulos explícitos.

O grafo 3D existente permanece. Selecionar um tópico destaca suas relações e abre um painel contextual de largura controlada; sem seleção, mostrar uma orientação breve em vez de um painel vazio ocupando uma coluna inteira.

O painel apresenta disciplina, tópico, estado, domínio e relações. “Estudar agora” é a ação principal. Planner, Recall e resumo LIA permanecem disponíveis com retorno de carregamento, sucesso ou erro. A remoção fica em área separada e exige confirmação.

Adicionar controles explícitos de zoom, reenquadramento e pausa da rotação. Respeitar a preferência por movimento reduzido. Identificar estados por texto e forma além da cor. A lista de tópicos deve permitir selecionar e executar ações por teclado, sem depender da manipulação do grafo.

Manter os seis modos existentes e seus dados. Reorganizar a seleção de modos para reduzir competição visual. Listas recebem cabeçalhos claros, ordenação explicada e estados vazios úteis. Filtros de busca e disciplina devem afetar os modos de maneira consistente; relações só aparecem quando seus extremos estão visíveis.

Não apresentar uma estimativa geral de revisões como contagem exata do tópico. O código atual usa revisões do perfil como aproximação: a interface deve explicitar esse limite ou retirar a atribuição individual quando não houver dado suficiente.

## Página de apresentação

Primeira dobra com uma promessa curta sobre aprender com clareza, uma constelação como elemento visual central e ação inequívoca para entrar. Preservar autenticação real por e-mail e senha e suas mensagens de erro.

Apresentar o produto em três blocos: entender o conhecimento no Atlas; estudar com materiais e LIA; consolidar com prática e revisão. Usar demonstrações visuais honestas, identificando dados de exemplo. Evitar métricas inventadas, depoimentos fictícios e promessas de privacidade incompatíveis com os serviços utilizados.

Transições discretas, sem esconder conteúdo essencial se animações ou observadores não executarem. Em celular, a mensagem e a ação de entrada vêm antes da ilustração.

## Painel inicial autenticado

Abrir com saudação, objetivo ativo e uma próxima ação baseada nos dados disponíveis. Se houver revisões pendentes, oferecer retomada do Recall; caso contrário, permitir iniciar estudo pelo Atlas ou pelo planejamento existente. Sem dados, orientar configuração e primeiro conteúdo.

Hierarquia: próxima ação; agenda e revisões; evolução por disciplina; indicadores secundários. Exibir apenas números provenientes do estado real, eliminando o crescimento semanal fixo. A seção de evolução deve declarar o período quando existir série histórica; sem histórico, apresentar domínio atual.

Manter os compromissos, metas, revisões e demais informações existentes acessíveis após reorganização.

## Restante do produto

Aplicar sistema comum a biblioteca, busca, aprender, simulados, recall, questões, caderno de erros, análises, leitor, comparação, fórmula, quadro, foco, planner, projetos, previsão, studio, laboratório, oral, LIA, onboarding, configurações e ajuda.

Além dos tokens compartilhados, revisar cada tela: título e descrição, ação principal, largura, organização de formulários, listas, painéis e mensagens. A reformulação não se resume a trocar cores globais. Bibliotecas e listas devem ter boa leitura; editores e quadros precisam de área útil; fluxos de estudo precisam manter o foco na atividade atual.

## Limites e preservação

Manter React, TypeScript, Tailwind, APIs, autenticação, rotas e persistência existentes. Não alterar esquemas do banco nem substituir serviços de IA como parte desta reformulação. Preservar alterações locais e dados do usuário. Não publicar nem fazer deploy nesta etapa.

Novas interações precisam ter comportamento implementado; não criar botões decorativos. A busca do Atlas pode ser local sobre os dados carregados. A busca global deve encaminhar ao fluxo existente e só anunciar atalho quando estiver ligado à ação correspondente.

A restrição de escrita inicial foi removida pelo ambiente antes da implementação. O trabalho foi realizado no projeto original, em branch própria, com backup das fontes anteriores.

## Ordem de execução proposta

1. Registrar estado inicial, preservar mudanças locais e executar verificações de base.
2. Refinar tokens, componentes, temas e estrutura de navegação.
3. Reformular Atlas e controles do grafo.
4. Reformular landing e painel inicial.
5. Revisar individualmente as demais telas com o mesmo sistema e aplicar a identidade às telas equivalentes do cliente desktop, preservando integrações nativas.
6. Validar funcionamento, acessibilidade e aparência; corrigir problemas encontrados.

## Critérios de aceitação

- Landing, início e Atlas com hierarquia distinta e identidade comum.
- Todas as rotas existentes acessíveis e nenhuma ação de estudo removida.
- Atlas com busca, filtro, seleção, zoom, pausa e alternativa por lista utilizáveis.
- Formulários com rótulos, foco visível e mensagens claras; navegação por teclado nos fluxos principais.
- Layout revisado em larguras aproximadas de 390, 768 e 1440 pixels, incluindo tema claro e escuro quando suportados.
- Movimento reduzido respeitado; nenhuma rotação obrigatória durante a leitura.
- Build, verificações de tipos e testes existentes executados, com falhas anteriores distinguidas das introduzidas pela mudança.
- Executar as verificações frontend de web e desktop separadamente. Validar o aplicativo Tauri se o ambiente tiver as ferramentas necessárias; registrar explicitamente se a verificação nativa não puder ser executada.
- Inspeção visual no navegador dos estados normal, vazio, carregamento e erro; registrar limitações caso o backend ou uma conta não estejam disponíveis.
- Entrega com descrição do que mudou, resultados reais das verificações e prévias das telas principais.

## Aprovação

Aprovado pelo usuário, com autorização explícita para começar as alterações e reforço para animações, 3D e elegância na landing e no Atlas. O escopo inclui web e desktop, com prioridade para web, Atlas e páginas iniciais.
