# PRISMA — design.md (base de design da landing)

## 1. Ouvidoria — 20+ sites de referência analisados (fetch direto, 2026-11-15)
| Site | O que fazem de animação/3D/beleza |
|---|---|
| apple.com | Hero full-bleed com produto + tipografia gigante (tracking negativo), nav fina com blur, seções alternadas preto/branco, reveals no scroll, "Learn more" discreto, footer hairline |
| apple.com/iphone, /mac, /apple-vision-pro | Headline em itálico fino dentro de frase grande, vídeos hero em loop, scroll-driven zoom do produto, spec sections com números grandes |
| linear.app | Fundo escuro com mesh gradient sutil, hero centralizado, animação de entrada escalonada, mock do app com sombra profunda |
| stripe.com | Gradiente animado no hero (canvas), ângulos 3D nos painéis, copy em itálico + negrito misturado, logos em marquee |
| vercel.com | Triângulos/gradientes geométricos, tipografia Geais tight, contraste preto puro, CTAs com anel no hover |
| rauno.me | Minimalismo extremo, micro-interações em cada link, manifesto curto ("Make it fast. Make it beautiful…") |
| emilkowal.ski | Lista editorial simples, um banner de anúncio no topo, zero décoration — prova de que tipografia boa basta |
| lusion.co | WebGL 3D fullscreen, "scroll to explore", tipografia enorme, vídeos autoplay em cards de projeto |
| activetheory.net | 3D imersivo + vídeo fullscreen, copy curta e ousada |
| resn.co.nz | Transições de página 3D, cursor custom, narração em scroll |
| sonos.com | Blocos de cor sólida full-bleed, produto em foto grande, pouco texto |
| nothing.tech | Fundo claro com tipografia mono/dot-matrix, produto flutuando, vídeos full-bleed |
| teenage.engineering | Estética industrial/retro, tipografia thin, grids visíveis, vermelho como único acento |
| porsche.com / audi.com / bmw.de | Hero com vídeo/foto do produto, headline curta, CTAs duplos (primário + link), cards de modelos com hover zoom |
| nasa.gov | Dark theme espacial, imagens grandes, busca proeminente, links "Suggested searches" |
| arc.net | Página de despedida com scroll storytelling e assinatura manuscrita |
| figma.com / framer.com / loom.com | Hero com vídeo/demonstração do produto, logo wall (marquee de clientes), seções de use-case com cards grandes |

## 2. Padrões extraídos (o que TODOS os bons fazem)
1. **Um único elemento visual memorável no hero** (produto/vídeo/3D) — o resto fica quieto.
2. **Tipografia gigante com tracking negativo** (‑0.02 a ‑0.04em) + peso 600–700; itálico fino para énfasis dentro da frase.
3. **Nav fixa fina com blur** que aparece só depois do scroll.
4. **Reveals no scroll** (IntersectionObserver, translateY + fade, easing cubic-bezier(.22,1,.36,1)).
5. **Seções full-bleed alternadas** (fundo escuro → tertial → escuro), divisórias hairline.
6. **Marquee/logo wall** para prova social.
7. **CTA primário sólido + secundário em texto** — nunca dois botões iguais.
8. **Motion com propósito**: entrada escalonada no load, parallax leve no hero, hover states em tudo; `prefers-reduced-motion` respeitado.
9. **Fundos com gradiente mesh/aurora animado + textura de ruído** (evita "flat black" chapado).
10. **3D interativo que responde ao mouse** (parallax/tilt), não só autoplay.

## 3. Tokens do PRISMA (mantidos do app — Graphite Academic)
- Tipo: **Inter** (sans), JetBrains Mono para dados/labels pequenos.
- Cores (dark): bg `#171B21`, surface `#292F38`, tertiary `#1F242D`, border `#3A414D`, texto `#F2F1ED`, secundário `#B8BFC9`, muted `#8A93A1`, acento **sálvia `#8AA7A1`**, accent-bg `#1E3A36`, semânticas: success `#54756D`, warning `#D4A843`, error `#C45D5D`, info `#5D9CC4`.
- Escala de type: hero clamp(3rem→4.5rem), h2 clamp(2rem→3rem), tracking ‑0.03em nos títulos.
- Raios: 12px cards, 8px botões (padrão do app).
- Motion: entrada escalonada 80ms entre elementos; reveal `.8s cubic-bezier(.22,1,.36,1)`; easing padrão `ease-out` 150–300ms.

## 4. Decisões desta rodada (landing v3)
- **Hero artifact = constelação 3D em canvas 2D** (projeção perspectiva própria, sem lib): ~70 nós numa casca esférica girando lentamente, linhas entre nós próximos, profondeur (tamanho/alpha por z), **reage ao mouse** (tilt + nós atraídos), glow sálvia. Substitui o prisma (rejeitado pelo usuário).
- **Fundo**: aurora mesh animada (2 radiais grandes com blur + drift) + grid hairline + **ruído SVG (feTurbulence)** em overlay 3% para textura.
- **Entrada do hero escalonada**: eyebrow → h1 (por linha) → sub → CTAs, com máscara de reveal (clip-path/translate).
- **Barra de progresso de scroll** fina no topo (sálvia).
- **Cursor spotlight** sutil no hero (radial segue o mouse, 4% opacidade).
- Seções, marquee, mocks CSS e CTA com login permanecem; login continua só e-mail+senha.
