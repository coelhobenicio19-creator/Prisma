# SSD_CLEANUP_REPORT.md — Limpeza pós-migração Desktop→Web (2026-11-13)

## Espaço no SSD (128 GB, drive C:)
- **Antes:** 2,56 GB livres
- **Depois:** 8,80 GB livres
- **Recuperado: ~6,2 GB**

## Itens removidos (todos baixados/instalados por mim para o PRISMA Desktop; autorizados pelo usuário em 13/11/2026 ~17:40)
| Item | Caminho | GB | Risco |
|---|---|---|---|
| WinLibs MinGW (winget) | desinstalado via `winget uninstall BrechtSanders.WinLibs.POSIX.UCRT` | ~1,5 (cache WinGet limpo pelo uninstall) | seguro — só usado p/ build Rust |
| Cópia do MinGW no workspace | `C:\Users\charl\nanoMuse\mingw64` | 0,90 | seguro — era cópia minha |
| Toolchain Rust (rustup+cargo) | `C:\Users\charl\nanoMuse\rust_home` | 2,70 | seguro p/ PRISMA Web; reinstalável via rustup se outro projeto precisar |
| node_modules do desktop | `PRISMA/apps/desktop/node_modules` | 0,16 | regenerável (`npm install`) |
| cache npm do desktop | `PRISMA/apps/desktop/.npm-cache` | 0,24 | regenerável |
| build do desktop | `PRISMA/apps/desktop/dist` | 0 | regenerável |
| artefatos cargo | `PRISMA/apps/desktop/src-tauri/target` | 1,14 | regenerável |
| arquivos temporários meus | `rel.json`, `dl_mingw.js`, `mingw.zip`, `tmp/` em `C:\Users\charl\nanoMuse` | ~0 | seguro |

## Preservado (justificativa)
- **Código-fonte completo** do PRISMA (desktop + web) — git local em `PRISMA/.git`, tag `backup-desktop-v1`, 3 commits. Verificado: sem segredos trackeados.
- **Node.js, npm, Git, Python** — ferramentas compartilhadas (NanoMuse/Codex/outros projetos). Não removidos.
- **WebView2, drivers, pagefile.sys, arquivos de sistema** — intocados.
- `PRISMA/apps/web/node_modules` — necessário para desenvolver/testar o site localmente.
- Chrome, pip cache, etc. — não foram instalados por mim para o app; mantidos.

## Verificações pós-limpeza
- `apps/web` build passa: `tsc && vite build` ✓ (1659 módulos, dist gerado) — 13/11/2026 17:41.
- Nenhum processo do build desktop ativo.

## Recomendações
- Builds de produção do site devem ocorrer no serviço de hospedagem (Vercel), não localmente.
- Evitar reinstalar toolchains Rust/Tauri no notebook.
- Limpar `AppData\Local\Temp` periodicamente (0,7 GB medido) — não feito agora por poder conter temporários de outros apps em uso.
