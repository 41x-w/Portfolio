// Simple structure: one-screen squeeze grid + right glide-in menu + work page.
// Content: /data/works.json (edit in /admin).
(() => {
  const $ = (s) => document.querySelector(s);
  const isTouch = matchMedia('(hover: none)').matches;
  const media = (src) => /\.(mp4|webm|mov)$/i.test(src)
    ? `<video src="${src}" muted loop playsinline preload="metadata"></video>`
    : `<img src="${src}" alt="" loading="lazy">`;
  let works = [], cats = [], focusWork = () => {};
  // pastel fill + dark text of the same hue, per category
  const PAL = {fashion: ['#FBEAF0', '#72243E'], portrait: ['#F1EFE8', '#444441'], interaction: ['#EEEDFE', '#3C3489'], motion: ['#FAECE7', '#712B13'], graphic: ['#E6F1FB', '#0C447C'], brand: ['#E1F5EE', '#085041']};
  const EXTRA = [['#EAF3DE', '#27500A'], ['#FAEEDA', '#633806'], ['#E1F5EE', '#085041']];
  const pal = (id) => PAL[id] || EXTRA[Math.abs([...id].reduce((a, c) => a + c.charCodeAt(0), 0)) % EXTRA.length];
  const catZh = (id) => (cats.find((c) => c.id === id) || {}).nameZh || id;

  /* grid: rows of random-sized tiles; the focused tile grows, the rest squeeze */
  function buildGrid() {
    const grid = $('#grid'), list = works.slice().sort(() => Math.random() - 0.5);
    grid.innerHTML = '';
    const rows = [], tiles = [], pattern = [3, 4, 2, 3]; // same rows as the demo
    let k = 0, p = 0;
    while (k < list.length) {
      let n = pattern[p++ % pattern.length];
      if (list.length - k - n === 1) n++;
      const r = document.createElement('div'); r.className = 'row';
      r.base = 0.8 + Math.random() * 0.6; r.style.flexGrow = r.base; grid.appendChild(r); rows.push(r);
      list.slice(k, k + n).forEach((w) => {
        const t = document.createElement('div'); t.className = 'tile';
        t.base = 0.7 + Math.random() * 1.1; t.style.flexGrow = t.base; t.row = r; t.work = w;
        const [bg, fg] = pal(w.category);
        t.style.background = bg; t.style.color = fg;
        t.innerHTML = `<div class="txt"><b>${catZh(w.category)}</b><span>${w.title}${w.year ? ' · ' + w.year : ''}</span></div>`;
        t.onpointerenter = (e) => e.pointerType === 'mouse' && focus(t);
        t.onclick = () => (isTouch && !t.classList.contains('on') ? focus(t) : openWork(w));
        r.appendChild(t); tiles.push(t);
      });
      k += n;
    }
    function focus(f) {
      tiles.forEach((t) => {
        t.classList.toggle('on', t === f);
        t.style.flexGrow = !f ? t.base : t === f ? t.base * 4 : t.row === f.row ? t.base * 0.6 : t.base;
      });
      rows.forEach((r) => (r.style.flexGrow = !f ? r.base : r === f.row ? r.base * 3.2 : r.base * 0.55));
    }
    grid.onpointerleave = (e) => e.pointerType === 'mouse' && focus(null);
    focusWork = (w) => focus(tiles.find((t) => t.work === w) || null);
  }

  /* right-side menu */
  const menu = $('#menu'), shade = $('#shade'), burger = $('#burger');
  function toggleMenu(open = !menu.classList.contains('open')) {
    [menu, shade, burger].forEach((e) => e.classList.toggle(e === burger ? 'on' : 'open', open));
    burger.setAttribute('aria-expanded', open); menu.setAttribute('aria-hidden', !open);
    if (!open) focusWork(null);
  }
  function buildMenu() {
    $('#menuList').innerHTML = works.map((w, i) =>
      `<div class="item" data-i="${i}" style="transition-delay:${Math.min(i, 10) * 45}ms"><span>${w.title}</span><small>${w.year || ''}</small></div>`).join('');
  }
  burger.onclick = () => toggleMenu();
  $('#shuffle').onclick = () => buildGrid();
  shade.onclick = () => toggleMenu(false);
  $('#menuList').onclick = (e) => { const it = e.target.closest('.item'); if (it) { toggleMenu(false); setTimeout(() => openWork(works[it.dataset.i]), 250); } };
  $('#menuList').onpointerover = (e) => { const it = e.target.closest('.item'); if (it) focusWork(works[it.dataset.i]); };

  /* work page */
  const ov = $('#overlay');
  function openWork(w) {
    $('#overlayInner').innerHTML = `<h2>${w.title}</h2><p>${[w.category, w.year, w.role].filter(Boolean).join(' · ')}<br>${w.description || ''}</p>` +
      (w.images && w.images.length ? w.images : [w.cover]).map((s) => `<img src="${s}" alt="${w.title}" loading="lazy">`).join('');
    ov.classList.add('open'); ov.scrollTop = 0;
  }
  const closeWork = () => ov.classList.remove('open');
  $('#closeBtn').onclick = closeWork;
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeWork(); toggleMenu(false); } });

  Promise.all([fetch('/data/site.json').then((r) => r.json()), fetch('/data/works.json').then((r) => r.json())]).then(([site, data]) => {
    $('#navName').textContent = site.name || 'Portfolio';
    document.title = site.name || 'Portfolio';
    works = data.works || []; cats = data.categories || [];
    buildGrid(); buildMenu();
  });
})();
