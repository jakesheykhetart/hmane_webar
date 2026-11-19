/* HMANE Central Portal — flow
 * splash (tap unlocks audio) → intro video (skippable after 3 s) → coded text cards
 * → BEGIN (camera permission) → live AR with halos → experience → back to live AR.
 * Add ?start=ar to the URL to go straight to the camera (e.g. a "back to portal" link).
 */
(function () {
  const CFG = window.HMANE_CONFIG, T = CFG.timing, TXT = CFG.text;
  const $ = (s) => document.querySelector(s);
  // Visitor analytics (analytics.js). Falls back to no-ops if that file is missing.
  const A = window.HMANE_ANALYTICS || { track() {}, screen() {}, experienceOpened() {}, experienceClosed() {}, watchFrame() {}, endVisit() {} };
  const body = document.body;
  const params = new URLSearchParams(location.search);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise(r => setTimeout(r, reduced ? Math.min(ms, 150) : ms));

  const els = {
    splash: $('#splash'), tap: $('#tapToBegin'),
    intro: $('#intro'), video: $('#introVideo'), skip: $('#skipIntro'),
    cards: $('#cards'), welcome: $('#cardWelcome'), galleries: $('#cardGalleries'), begin: $('#beginBtn'),
    ar: $('#ar'), stage: $('#arStage'), help: $('#helpBtn'), hint: $('#hint'),
    chips: $('#foundChips'), edgeGlow: $('#edgeGlow'),
    status: $('#arStatus'), retry: $('#retryBtn'), toast: $('#toast'),
    exp: $('#experience'), frame: $('#expFrame'), expClose: $('#expClose')
  };

  // ---------- copy ----------
  const lines = (arr) => arr.map(t => `<span>${t}</span>`).join('');
  els.tap.textContent = TXT.tapToBegin;
  els.skip.textContent = TXT.skip;
  els.welcome.querySelector('.card__title').innerHTML = lines(TXT.welcomeTitle);
  els.galleries.querySelector('.card__title').textContent = TXT.galleriesTitle;
  els.galleries.querySelector('.card__body').innerHTML = lines(TXT.galleriesBody);
  els.begin.textContent = TXT.begin;
  els.retry.textContent = TXT.retry;
  // thumbnails of the objects to look for (shown while searching)
  els.hint.querySelector('.hint__thumbs').innerHTML =
    CFG.objects.map(o => `<img src="${o.thumb}" alt="${o.title}">`).join('');
  els.expClose.textContent = TXT.backToPortal;

  // ---------- media for this screen shape ----------
  const landscape = matchMedia('(orientation: landscape)').matches;
  const media = landscape ? CFG.media.landscape : CFG.media.portrait;
  els.video.src = media.video;
  els.video.load();

  let state = '';
  function show(name) {
    state = name;
    A.screen(name);
    body.className = 'state-' + name;
    for (const s of [els.splash, els.intro, els.cards, els.ar]) s.classList.toggle('is-on', s.id === name || (name === 'help' && s.id === 'ar'));
    if (name === 'help') els.cards.classList.add('is-on');
    els.intro.setAttribute('aria-hidden', name !== 'intro');
  }

  // ---------- 1. splash ----------
  function startIntro() {
    if (state !== 'splash') return;
    A.track('tapped_to_begin');
    const v = els.video;
    v.muted = false; v.volume = 1;
    // play() must be called inside the tap so audio is allowed
    const p = v.play();
    show('intro');
    if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(() => endIntro()); });
    setTimeout(() => { if (state === 'intro') { els.skip.hidden = false; els.skip.classList.add('fade-in'); } }, T.skipAppearsAfter);
    setTimeout(warmUpAR, 1200);   // after the video has started smoothly
  }
  els.splash.addEventListener('click', startIntro);

  // ---------- 2. intro ----------
  let introDone = false;
  async function endIntro(skipped) {
    if (introDone) return; introDone = true;
    A.track('intro_finished', { skipped: !!skipped, watched_seconds: Math.round(els.video.currentTime || 0) });
    els.skip.hidden = true;
    if (skipped) {
      els.intro.classList.add('video-out');
      await wait(500);
      els.video.pause();
    }
    els.video.removeAttribute('src'); els.video.load();   // release the decoder and memory
    show('cards');
    await wait(skipped ? 250 : T.afterVideoPause);
    runCards();
  }
  els.video.addEventListener('ended', () => endIntro(false));
  els.skip.addEventListener('click', (e) => { e.stopPropagation(); endIntro(true); });

  // ---------- 3. text cards ----------
  function fade(card, on, ms) {
    card.style.setProperty('--fade', (reduced ? 150 : ms) + 'ms');
    card.classList.toggle('show', on); card.classList.toggle('hide', !on);
  }
  let cardsAdvance = null;
  async function hold(ms) {   // a tap on the card skips the hold
    await Promise.race([wait(ms), new Promise(r => { cardsAdvance = r; })]);
    cardsAdvance = null;
  }
  els.cards.addEventListener('click', (e) => { if (e.target === els.begin) return; cardsAdvance && cardsAdvance(); });

  async function runCards() {
    fade(els.welcome, true, T.welcomeFadeIn);
    await wait(T.welcomeFadeIn);
    await hold(T.welcomeHold);
    fade(els.welcome, false, T.welcomeFadeOut);
    await wait(T.welcomeFadeOut);
    showGalleriesCard(TXT.begin);
  }
  async function showGalleriesCard(label) {
    els.begin.textContent = label;
    fade(els.galleries, true, T.galleriesFadeIn);
    await wait(T.galleriesFadeIn + T.beginButtonDelay);
    els.begin.hidden = false; els.begin.classList.add('fade-in');
    els.begin.focus({ preventScroll: true });
  }

  els.begin.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state === 'help') { closeHelp(); return; }
    A.track('begin_pressed');
    enterAR();
  });

  // ---------- 4. live AR ----------
  let arMounted = false;
  function setStatus(text, { loading = false, retry = false } = {}) {
    els.status.hidden = !text;
    els.status.classList.toggle('loading', loading);
    els.status.querySelector('.ar-status__text').textContent = text || '';
    els.retry.hidden = !retry;
  }
  function setHint(found) {
    els.hint.classList.toggle('found', found);
    els.hint.querySelector('.hint__text').textContent = found ? TXT.hintFound : TXT.hintSearching;
    if (!found) setSight([]);
  }
  // Found objects: a "Tap to explore" button each; in close-up (outline doesn't fit on screen, or the
  // halo hasn't locked yet) the screen edges glow and the hint says a tap anywhere works.
  let closeTimer = null;
  function setSight(list) {
    const ids = list.map(x => x.obj.id).join(',');
    if (els.chips.dataset.ids !== ids) {
      els.chips.dataset.ids = ids;
      els.chips.innerHTML = '';
      for (const { obj } of list) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'found-chip';
        b.innerHTML = `<img src="${obj.thumb}" alt=""><span class="found-chip__text"><span class="found-chip__title"></span><span class="found-chip__action"></span></span>`;
        b.querySelector('.found-chip__title').textContent = obj.title;
        b.querySelector('.found-chip__action').textContent = TXT.chipAction || 'Tap to explore';
        b.setAttribute('aria-label', (TXT.chipAction || 'Tap to explore') + ': ' + obj.title);
        b.addEventListener('click', (e) => { e.stopPropagation(); window.HMANE_AR.openSighted(obj.id) || openExperience(obj); });
        els.chips.appendChild(b);
      }
    }
    els.chips.hidden = !list.length;
    const anyHalo = list.some(x => x.mode === 'halo');
    const close = list.length > 0 && !anyHalo && list.some(x => x.mode === 'close');
    els.hint.classList.toggle('found', list.length > 0);
    els.hint.classList.toggle('has-chips', list.length > 0);
    els.hint.querySelector('.hint__text').textContent =
      !list.length ? TXT.hintSearching : anyHalo || list.length > 1 ? TXT.hintFound : (TXT.hintClose || TXT.hintFound);
    // brief delay so the edges don't flash while the halo is still locking on
    clearTimeout(closeTimer);
    if (close) closeTimer = setTimeout(() => els.edgeGlow.classList.add('on'), 350);
    else els.edgeGlow.classList.remove('on');
  }

  async function waitForAR() {
    while (!window.HMANE_AR) await new Promise(r => setTimeout(r, 50));
    return window.HMANE_AR;
  }

  let cameraAskedAt = 0, cameraStarts = 0;
  async function enterAR() {
    cameraAskedAt = performance.now();
    show('ar');
    els.begin.hidden = true;
    fade(els.galleries, false, 300);
    setHint(false);
    setStatus(TXT.startingCamera, { loading: true });
    const AR = await ensureMounted();
    await AR.start();
  }
  async function ensureMounted() {
    const AR = await waitForAR();
    if (!arMounted) {
      arMounted = true;
      AR.onVideo = () => {                       // show the camera as soon as it's live
        setStatus('');
        A.track('camera_started', { restart: cameraStarts++ > 0, wait_ms: cameraAskedAt ? Math.round(performance.now() - cameraAskedAt) : null });
        cameraAskedAt = 0;
      };
      AR.onReady = () => setStatus('');
      AR.onError = (d) => {
        setStatus(TXT.cameraError, { retry: true });
        A.track('camera_blocked', { error: String((d && (d.error || d.name || d.message)) || d || 'unknown').slice(0, 80) });
      };
      AR.onSightChange = (list) => { if (state === 'ar') setSight(list); };
      AR.onTap = openExperience;
      AR.mount(els.stage);
    }
    return AR;
  }
  // Warm up tracking in the background during the intro (no camera needed), then build the AR scene
  async function warmUpAR() {
    const AR = await waitForAR();
    await AR.prewarm();
    await ensureMounted();
  }
  els.retry.addEventListener('click', () => { A.track('camera_retry'); location.href = location.pathname + '?start=ar'; });

  // help overlay ("?") — the Galleries card on top of the camera
  els.help.addEventListener('click', () => {
    A.track('help_opened');
    show('help');
    els.welcome.classList.remove('show');
    showGalleriesCard(TXT.resume);
  });
  function closeHelp() {
    els.begin.hidden = true;
    fade(els.galleries, false, 300);
    show('ar');
  }

  // ---------- 5. experiences ----------
  let inExperience = null;
  function openExperience(obj) {
    if (inExperience) return;
    A.experienceOpened(obj);
    if (obj.open === 'tab') {
      // must open synchronously inside the tap, or browsers block it
      const a = document.createElement('a');
      a.href = obj.url; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      toast(TXT.openedInNewTab);
      return;   // camera is released/restored by the visibility handler below
    }
    inExperience = obj;
    setTimeout(() => {
      window.HMANE_AR.stop();                      // free the camera for the experience
      const u = new URL(obj.url, location.href);
      u.searchParams.set('from', 'portal');
      els.frame.src = u.toString();
      els.exp.hidden = false;
      els.exp.classList.add('is-on');               // .screen layers are invisible until switched on
      body.classList.add('in-experience');
      A.screen('experience:' + obj.id);
    }, 280);                                       // let the tap flash read first
  }
  function closeExperience(how) {
    if (!inExperience) return;
    A.experienceClosed(how || 'back_button');
    inExperience = null;
    els.frame.src = 'about:blank';
    els.exp.hidden = true;
    els.exp.classList.remove('is-on');
    body.classList.remove('in-experience');
    show('ar'); setHint(false);
    setStatus(TXT.startingCamera, { loading: true });
    window.HMANE_AR.start();
  }
  els.expClose.addEventListener('click', () => closeExperience('back_button'));
  A.watchFrame(els.frame);   // counts finished chapters inside the experience
  // An experience can send the visitor back itself when it finishes:
  //   window.parent.postMessage({ type: 'hmane:experience-complete' }, '*');
  window.addEventListener('message', (e) => {
    if (e.source !== els.frame.contentWindow) return;
    const t = e.data && e.data.type;
    if (t === 'hmane:experience-complete') closeExperience('finished');
    else if (t === 'hmane:exit') closeExperience('exit');
  });

  let toastTimer;
  function toast(msg) {
    els.toast.textContent = msg; els.toast.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { els.toast.hidden = true; }, 4500);
  }

  // Release the camera when the tab is hidden (new tab, app switch) and restore it on return
  document.addEventListener('visibilitychange', () => {
    const AR = window.HMANE_AR;
    if (!AR || !arMounted || inExperience) return;
    if (document.hidden) AR.stop();
    else if (state === 'ar' || state === 'help') { setStatus(TXT.startingCamera, { loading: true }); AR.start(); }
  });

  // ---------- idle reset for museum tablets ----------
  if (CFG.idleResetMinutes > 0) {
    let idle;
    const arm = () => { clearTimeout(idle); idle = setTimeout(() => { if (state !== 'splash' && !inExperience) { A.endVisit('idle_reset'); location.href = location.pathname; } }, CFG.idleResetMinutes * 60000); };
    ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, arm, { passive: true }));
    arm();
  }

  // ---------- diagnostics: add ?debug=1 to the URL ----------
  if (params.get('debug') === '1') {
    const hud = document.createElement('pre');
    hud.className = 'debug-hud';
    document.body.appendChild(hud);
    setInterval(() => {
      const AR = window.HMANE_AR, sc = AR && AR.sceneEl;
      const sys = sc && sc.systems && sc.systems['mindar-image-system'];
      const v = sys && sys.video, ctl = sys && sys.controller;
      const st = (ctl && ctl.trackingStates) || [];
      hud.textContent = [
        'state: ' + state + (AR && AR.running ? ' · AR running' : ' · AR off'),
        'camera: ' + (v && v.videoWidth ? v.videoWidth + '×' + v.videoHeight : '—'),
        (() => { const s = AR && AR.stats; if (!s) return 'search: —';
          const secs = Math.max(1, (performance.now() - s.t0) / 1000), pc = (a, b) => b ? Math.round(100 * a / b) + '%' : '—';
          return 'search ' + (s.search / secs).toFixed(1) + '/s, hits ' + pc(s.searchHits, s.search) + ' · track ok ' + pc(s.trackOk, s.track) + ' (' + s.track + ')'; })(),
        'tracking keyframe: ' + (window.HMANE_TRACK_KEYFRAME ? '128 px' : '256 px'),
        ...CFG.objects.map(o => {
          const views = o.targets || [{ index: o.targetIndex, name: 'main' }];
          const on = views.find(v => st[v.index] && st[v.index].showing);
          const lock = views.find(v => st[v.index] && st[v.index].isTracking);
          const sight = (AR._sight || []).find(x => x.obj.id === o.id);
          return o.id + ': ' + (!st.length ? '—' : on ? 'TRACKED (' + (on.name || on.index) + ')' : lock ? 'locking…' : 'searching') +
            (sight ? '  · FOUND [' + sight.mode + ']' : '');
        })
      ].join('\n');
    }, 300);
  }

  // ---------- go ----------
  if (params.get('start') === 'ar') { introDone = true; els.video.removeAttribute('src'); enterAR(); }
  else show('splash');
})();
