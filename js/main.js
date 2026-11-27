// Portfolio site — all content comes from /data/site.json and /data/works.json (editable in /admin)
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const cl = (x) => Math.max(0, Math.min(1, x));
  const E = (t) => 1 - Math.pow(1 - t, 4);              // ease out (enter)
  const IO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // ease in-out (camera)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover: none)').matches;
  const CJK = /[　-鿿＀-￯]/;
  let SITE = {}, DATA = {categories: [], works: []}, ZOOM = 0.12;

  const media = (src, cls = '') => {
    if (/\.(mp4|webm|mov)$/i.test(src)) return `<video class="${cls}" src="${src}" muted loop playsinline preload="metadata"></video>`;
    return `<img class="${cls}" src="${src}" alt="" loading="lazy">`;
  };
  const catName = (id) => DATA.categories.find((c) => c.id === id) || {name: id, nameZh: id};

  /* ---------- blur-in text (titles everywhere) ---------- */
  function splitBlur(el, step = 70) {
    const txt = el.textContent.trim();
    const parts = CJK.test(txt) ? [...txt] : txt.split(/\s+/);
    el.innerHTML = parts.map((p, i) => `<span class="bw" style="transition-delay:${i * step}ms;margin-right:${CJK.test(p) ? 0 : '.25em'}">${p}</span>`).join('');
    el.style.setProperty('--bz', 1 + ZOOM);
  }
  const blurObs = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); blurObs.unobserve(e.target); } }), {threshold: 0.3});
  function initBlur(root = document) { root.querySelectorAll('.blur-text:not([data-b])').forEach((el) => { el.dataset.b = 1; splitBlur(el, el.tagName === 'P' ? 25 : 70); blurObs.observe(el); }); }

  /* ---------- orbit cards (categories) ---------- */
  function orbit() {
    const st = $('#orbitStage'), label = $('#orbitLabel');
    const items = DATA.categories.map((c) => ({c, w: DATA.works.find((w) => w.category === c.id)})).filter((x) => x.w);
    const cards = items.map(({c, w}) => {
      const d = document.createElement('div'); d.className = 'orbit-card';
      d.innerHTML = media(w.loop || w.cover) + `<div class="cap"><b>${c.nameZh}</b><span>${c.name}</span></div>`;
      d.addEventListener('click', () => { if (moved) return; setFilter(c.id); $('#top').scrollIntoView({behavior: 'smooth'}); });
      st.appendChild(d); return d;
    });
    let ang = 0, vel = 0.12, drag = false, lx = 0, moved = false, visible = false;
    st.addEventListener('pointerdown', (e) => { drag = true; moved = false; lx = e.clientX; });
    addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - lx; if (Math.abs(dx) > 3) moved = true; ang += dx * 0.25; vel = dx * 0.25; lx = e.clientX; });
    addEventListener('pointerup', () => { drag = false; });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(frame); }).observe(st);
    function frame() {
      if (!drag) { vel += (0.12 - vel) * 0.03; ang += reduce ? 0 : vel; }
      const n = cards.length, R = Math.min(st.clientWidth * 0.36, 440);
      let front = 0, best = -9;
      cards.forEach((c, i) => {
        const a = (ang + (i * 360) / n) * Math.PI / 180, x = Math.sin(a) * R, z = Math.cos(a) * R, y = Math.cos(a) * -30;
        const k = (z + R) / (2 * R);
        c.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateY(${(Math.sin(a) * -12).toFixed(1)}deg)`;
        c.style.opacity = (0.35 + 0.65 * k).toFixed(3);
        c.style.filter = `blur(${((1 - k) * 4).toFixed(1)}px)`;
        c.style.zIndex = Math.round(k * 100);
        if (k > best) { best = k; front = i; }
        const v = c.querySelector('video'); if (v) (k > 0.85 ? v.play().catch(() => {}) : v.pause());
      });
      label.textContent = items[front] ? items[front].c.name.toUpperCase() : '';
      if (visible) requestAnimationFrame(frame);
    }
  }

  /* ---------- squeeze grid ---------- */
  let current = 'all', gridFocus = () => {};
  function setFilter(id) {
    current = id;
    document.querySelectorAll('#filters button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    squeeze(); buildMenu();
  }
  function filters() {
    const f = $('#filters');
    f.innerHTML = [`<button data-id="all" class="on">全部 All</button>`].concat(DATA.categories.map((c) => `<button data-id="${c.id}">${c.nameZh} ${c.name}</button>`)).join('');
    f.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setFilter(b.dataset.id); });
  }
  function squeeze() {
    const box = $('#squeeze');
    const list = DATA.works.filter((w) => current === 'all' || w.category === current).sort(() => Math.random() - 0.5);
    box.style.opacity = 0;
    setTimeout(() => {
      box.innerHTML = '';
      const rows = [], tiles = [];
      const pattern = list.length <= 3 ? [list.length] : [3, 4, 2, 3, 4];
      let k = 0, p = 0;
      while (k < list.length) {
        let n = pattern[p++ % pattern.length]; if (list.length - k - n === 1) n++;
        const r = document.createElement('div'); r.className = 'sq-row'; r.base = 0.8 + Math.random() * 0.5; r.style.flexGrow = r.base; box.appendChild(r); rows.push(r);
        list.slice(k, k + n).forEach((w) => {
          const t = document.createElement('div'); t.className = 'sq-tile'; t.base = 0.7 + Math.random() * 1.1; t.style.flexGrow = t.base; t.row = r; t.work = w;
          t.innerHTML = media(w.loop || w.cover) + `<div class="meta"><b>${w.title}</b><span>${catName(w.category).name} · ${w.year || ''}</span></div>`;
          t.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') focus(t); });
          t.addEventListener('click', () => { if (isTouch && !t.classList.contains('on')) focus(t); else openWork(w); });
          r.appendChild(t); tiles.push(t);
        });
        k += n;
      }
      gridFocus = (w) => focus(w ? tiles.find((t) => t.work === w) || null : null);
      function focus(f) {
        tiles.forEach((t) => {
          t.classList.toggle('on', t === f);
          t.style.flexGrow = f ? (t === f ? t.base * 4 : t.row === f.row ? t.base * 0.6 : t.base) : t.base;
          const v = t.querySelector('video'); if (v) (t === f ? v.play().catch(() => {}) : v.pause());
        });
        rows.forEach((r) => (r.style.flexGrow = f ? (r === f.row ? r.base * 3.2 : r.base * 0.55) : r.base));
      }
      box.onpointerleave = (e) => { if (e.pointerType === 'mouse') focus(null); };
      box.style.transition = 'opacity .5s'; box.style.opacity = 1;
    }, box.children.length ? 300 : 0);
  }


  /* ---------- glide-in menu (right side) ---------- */
  const menuEl = $('#menu'), burger = $('#burger'), shade = $('#menuShade');
  function toggleMenu(open) {
    open = open ?? !menuEl.classList.contains('open');
    [menuEl, shade].forEach((e) => e.classList.toggle('open', open));
    burger.classList.toggle('on', open); burger.setAttribute('aria-expanded', open); menuEl.setAttribute('aria-hidden', !open);
    if (!open) gridFocus(null);
  }
  burger.addEventListener('click', () => toggleMenu());
  shade.addEventListener('click', () => toggleMenu(false));
  menuEl.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) toggleMenu(false); });
  function buildMenu() {
    const list = $('#menuList');
    const cats = DATA.categories.filter((c) => current === 'all' || c.id === current);
    let i = 0;
    list.innerHTML = cats.map((c) => {
      const ws = DATA.works.filter((w) => w.category === c.id);
      if (!ws.length) return '';
      return `<p class="menu-cat">${c.nameZh} · ${c.name}</p>` + ws.map((w) => `<div class="menu-item" data-i="${DATA.works.indexOf(w)}" style="transition-delay:${Math.min(i++, 10) * 45}ms"><span>${w.title}</span><small>${w.year || ''}</small></div>`).join('');
    }).join('');
  }
  $('#menuList').addEventListener('click', (e) => { const it = e.target.closest('.menu-item'); if (!it) return; toggleMenu(false); setTimeout(() => openWork(DATA.works[it.dataset.i]), 250); });
  $('#menuList').addEventListener('pointerover', (e) => { const it = e.target.closest('.menu-item'); if (it) gridFocus(DATA.works[it.dataset.i]); });

  /* ---------- work detail ---------- */
  function embed(url) {
    let m;
    if ((m = url.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/))) return `<iframe src="https://www.youtube.com/embed/${m[1]}?rel=0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    if ((m = url.match(/vimeo\.com\/(\d+)/))) return `<iframe src="https://player.vimeo.com/video/${m[1]}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    return `<video src="${url}" controls playsinline></video>`;
  }
  const ov = $('#overlay'), inner = $('#overlayInner');
  function openWork(w) {
    const c = catName(w.category);
    inner.innerHTML = `<p class="kicker blur-text">${c.name} · ${c.nameZh}</p><h2 class="blur-text">${w.title}</h2>
      <div class="ov-meta">${w.year ? `<span>Year<b>${w.year}</b></span>` : ''}${w.role ? `<span>Role<b>${w.role}</b></span>` : ''}${w.client ? `<span>Client<b>${w.client}</b></span>` : ''}</div>
      ${w.description ? `<p class="ov-desc">${w.description}</p>` : ''}
      ${w.video ? `<div class="ov-video">${embed(w.video)}</div>` : ''}
      <div class="ov-gallery">${(w.images && w.images.length ? w.images : [w.cover]).map((s) => `<img src="${s}" alt="${w.title}" loading="lazy">`).join('')}</div>`;
    ov.classList.add('open'); ov.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; ov.scrollTop = 0;
    initBlur(inner);
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), {root: ov, threshold: 0.1});
    inner.querySelectorAll('.ov-gallery img').forEach((i) => io.observe(i));
  }
  function closeWork() { ov.classList.remove('open'); ov.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; setTimeout(() => (inner.innerHTML = ''), 500); }
  $('#closeBtn').addEventListener('click', closeWork);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeWork(); toggleMenu(false); } });

  /* ---------- about ---------- */
  function about() {
    $('#aboutEn').textContent = SITE.about || ''; $('#aboutZh').textContent = SITE.aboutZh || '';
    const links = [];
    if (SITE.email) links.push(`<a href="mailto:${SITE.email}">${SITE.email}</a>`);
    if (SITE.instagram) links.push(`<a href="${SITE.instagram}" target="_blank" rel="noopener">Instagram</a>`);
    if (SITE.cv) links.push(`<a href="${SITE.cv}" target="_blank" rel="noopener">CV</a>`);
    $('#contact').innerHTML = links.join('');
    $('#navName').textContent = $('#footName').textContent = SITE.name || 'Portfolio';
    $('#year').textContent = new Date().getFullYear();
    document.title = (SITE.name || 'Portfolio') + ' — Portfolio';
  }

  Promise.all([fetch('/data/site.json').then((r) => r.json()), fetch('/data/works.json').then((r) => r.json())]).then(([s, d]) => {
    SITE = s; DATA = d; ZOOM = Math.min(Number(s.zoom ?? 12), 25) / 100;
    if (isTouch) $('#hint').textContent = '撳一下放大 · 再撳打開作品 · 右上角選單可直接揀作品';
    about(); orbit(); filters(); squeeze(); buildMenu(); initBlur();
  });
})();
