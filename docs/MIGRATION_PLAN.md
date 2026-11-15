# MIGRATION_PLAN.md — Desenvolvimento PRISMA na Nuvem (gratuito, R$ 0,00)

Status: **PLANO PREPARADO — aguardando aprovações do usuário antes de executar uploads/instalações/exclusões.**

## O que já está pronto (local, sem custo, sem upload)
- [x] Git local com checkpoint `55ffde5` (código-fonte protegido, 250 KiB)
- [x] `.gitignore` seguro (sem node_modules, caches, .env, chaves, bancos)
- [x] Auditoria de armazenamento: `docs/STORAGE_AUDIT.md`
- [x] `.devcontainer/devcontainer.json` (ambiente Codespaces Linux: Node 24 + Rust)
- [x] `.github/workflows/ci.yml` (tsc + vite build + cargo check/test, runner ubuntu, gratuito)
- [x] `.github/workflows/build-windows.yml` (Tauri 2 + NSIS em `windows-latest`, artefato privado)

## Fase 2 — GitHub privado (PRECISA DE APROVAÇÃO)
1. Usuário cria repositório **privado** no GitHub (ou me autoriza a preparar os comandos; a autenticação é do usuário — `gh auth login` no navegador dele).
2. `git remote add origin <url>` + `git push -u origin main` — **só após autorização explícita**.
3. Verificar que `.gitignore` bloqueou segredos (`git ls-files | grep -i env` etc.).

## Fase 3 — GitHub Codespaces (gratuito: 120h/mês core + 15GB no free tier)
- Abrir o repo privado → Code → Create codespace → usa `.devcontainer/devcontainer.json`.
- Nele: `npm install`, `cargo check/test`, build do frontend — tudo fora do notebook.
- Limites free: 2 cores / 120 horas-core / 15 GB armazenamento por mês. Sem billing habilitado = não cobra.

## Fase 4 — GitHub Actions (gratuito: 2.000 min/mês no free)
- `ci.yml`: em cada push/PR — `tsc --noEmit`, `vite build`, `cargo check`, `cargo test`.
- `build-windows.yml`: manual (`workflow_dispatch`) — build Tauri 2 no `windows-latest`, gera NSIS, publica como **artifact** do run (privado no repo privado).
- Caches de npm/cargo ativados para economizar minutos.

## Fase 5 — Agente remoto
- O nanoMuse roda neste notebook (não há suporte nativo a execução remota via SSH testado).
- Alternativa gratuita: continuar eu (Mistral Large 4 via nanoMuse) aqui, mas com **builds na nuvem** (Codespaces/Actions) — o notebook vira terminal de acompanhamento.
- outra opção: rodar o código dentro do Codespace via VS Code Web e usar a API NVIDIA direto lá — requer credenciais no Codespace (secret) — **só com autorização explícita**, nunca expor a chave NVIDIA em texto plano.

## Fase 6 — Recuperação de espaço local (SOMENTE COM APROVAÇÃO ITEM A ITEM)
Candidatos a liberar (do audit), **nenhum apagado ainda**:
- `AppData\Local\Packages` (WinGet cache, 1,52 GB) — o MinGW instalado está em uso; mover/remover só depois de confirmar que o build migrou.
- `AppData\Local\npm-cache` (1,50 GB) — cache regenerável.
- `AppData\Local\pip` (1,44 GB) — cache regenerável.
- `rust_home` (1,88 GB) — só se o build passar 100% para a nuvem.
- `PRISMA/apps/desktop/node_modules` + `.npm-cache` (0,40 GB) — regeneráveis com `npm install`.
- `PRISMA/apps/desktop/dist` e `src-tauri/target` — artefatos regeneráveis.
- **Nunca apagar:** código-fonte, `.git`, migrações, docs, bancos SQLite pessoais, credenciais.

## Regras mantidas
R$ 0,00; sem planos pagos; sem billing; sem publicar código; sem expor chaves; sem apagar sem autorização; PRISMA continua do estado atual (não recomeça do zero).
