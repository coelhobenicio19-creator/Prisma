# 06_PERFORMANCE_REPORT.md — 2026-11-14

## Build de produção (medido)
- `npm run build` ≈ 50s
- `index-*.js` 243 kB (gzip **65 kB**) · `vendor-*.js` 164 kB (gzip 53 kB) · `ui-*.js` 50 kB (gzip 13 kB) · CSS 57 kB (gzip 8 kB)
- Code-splitting via `manualChunks` (vendor/ui separados); sem Tauri no bundle web.

## Otimizações já presentes
- react-query para cache de queries; Zustand com sélecteurs (evita re-render global)
- Listas de documentos/questões paginadas no servidor (`limit` em due/search)
- Mapa mental SVG leve (sem lib de grafos)
- SW (`public/sw.js`) para cache básico e push

## Gargalos conhecidos / não medidos ainda
- Lighthouse não foi executado (exige app no ar ou `vite preview` + browser). **Pendente.**
- Consumo de memória e FPS em listas muito grandes (>1000 itens) não medidos — paginação existe no backend, frontend renderiza lista inteira.
- Tempo de resposta da busca vetorial depende do índice pgvector no Supabase — não medido sem DB real.

## Limites free tier relevantes
- Vercel Hobby: 100 GB bandwidth, ~1000 invocações/dia serverless (suficiente p/ uso pessoal)
- Supabase Free: 500 MB DB, 1 GB storage, 50k MAU
- NVIDIA: conforme créditos da conta (chave do usuário)
