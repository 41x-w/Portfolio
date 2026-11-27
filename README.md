# Portfolio

Static portfolio site. Content lives in `data/site.json` and `data/works.json` and is edited at `/admin` (Decap CMS).

- Hero: blur-in text that recedes into depth, subtle zoom (set `zoom` 0–25 in site settings)
- Categories: orbit cards (drag / click to filter)
- Works: squeeze grid (hover to grow, others compress), click opens detail with gallery and video
- Covers can be an image or a short muted MP4 loop (`loop` field)

Local preview: `python3 -m http.server` then open http://localhost:8000
