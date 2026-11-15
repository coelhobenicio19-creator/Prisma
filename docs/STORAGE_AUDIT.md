# STORAGE_AUDIT.md — Auditoria de Armazenamento (2026-11-13)

## Situação
- Disco C: **114,54 GB total, 3,32 GB livres** (era ~14 GB livres antes do desenvolvimento PRISMA).
- Apenas 1 unidade de disco (C:). Não há unidade secundária/disponível para backup local.

## Consumo medido (GB)

| Local | GB | Observação |
|---|---|---|
| `C:\Users\charl\nanoMuse\PRISMA` (projeto inteiro) | **0,41** | node_modules 0,16 + .npm-cache 0,24 + código ~0,01 |
| `C:\Users\charl\nanoMuse\rust_home` (rustup+cargo) | **1,88** | toolchains + registry |
| `C:\Users\charl\AppData\Local` total | 19,23 | ver detalhamento abaixo |
| — Programs | 4,86 | apps instalados no perfil (incl. WinLibs/MinGW recém-instalado via winget) |
| — Google (Chrome) | 3,56 | perfil do Chrome |
| — Microsoft | 2,95 | WinGet links, etc. |
| — Packages (WinGet) | 1,52 | cache de pacotes winget (WinLibs incluso) |
| — npm-cache (padrão do usuário) | 1,50 | cache npm fora do projeto |
| — pip | 1,44 | cache pip |
| — Temp | 0,70 | temporários |
| — ms-playwright | 0,68 | browsers Playwright |
| `C:\Users\charl\AppData\Roaming` | 1,55 | inclui Crypto keys, etc. |

## Conclusão
- O **ambiente de desenvolvimento PRISMA em si consome ~2,3 GB** (projeto 0,41 + rust_home 1,88).
- A perda de ~10,5 GB veio majoritariamente de **caches/instalações no perfil do usuário** (AppData\Local), não do código-fonte.
- **Nada foi apagado.** Nenhum arquivo foi removido nesta auditoria.

## Proteção aplicada (Fase 0/1)
- Repositório git local criado em `C:\Users\charl\nanoMuse\PRISMA` (branch `main`).
- Commit checkpoint `55ffde5` com 66 arquivos de código-fonte (250 KiB) — `.gitignore` exclui node_modules, dist, target, caches, .env, chaves e bancos.
- Nenhum remote configurado. **Nada será enviado ao GitHub sem autorização explícita.**
- Nenhuma compilação pesada está rodando (verificado processos cargo/rustc — nenhum ativo).

## Backup
- Há apenas o disco C:, então um backup local completo não é viável sem risco.
- Opções seguras: (a) repositório GitHub **privado** (após autorização), (b) HD externo/nuvem pessoal do usuário, (c) zip do código-fonte (sem node_modules) em destino externo.
- O commit local `55ffde5` já funciona como checkpoint recuperável do estado atual.
