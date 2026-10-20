/* HMANE Central Portal — flow
 * splash (tap unlocks audio) → intro video (skippable after 3 s) → coded text cards
 * → BEGIN (camera permission) → live AR with halos → experience → back to live AR.
 * Add ?start=ar to the URL to go straight to the camera (e.g. a "back to portal" link).
 */
(function () {
  const CFG = window.HMANE_CONFIG, T = CFG.timing, TXT = CFG.text;
  const $ = (s) => document.querySelector(s);
  const body = document.body;
  const params = new URLSearchParams(location.search);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise(r => setTimeout(r, reduced ? Math.min(ms, 150) : ms));

  const els = {
    splash: $('#splash'), tap: $('#tapToBegin'),
    intro: $('#intro'), video: $('#introVideo'), skip: $('#skipIntro'),
    cards: $('#cards'), welcome: $('#cardWelcome'), galleries: $('#cardGalleries'), begin: $('#beginBtn'),
    ar: $('#ar'), stage: $('#arStage'), help: $('#helpBtn'), hint: $('#hint'),
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
  els.expClose.textContent = TXT.backToPortal;

  // ---------- media for this screen shape ----------
  const landscape = matchMedia('(orientation: landscape)').matches;
  const media = landscape ? CFG.media.landscape : CFG.media.portrait;
  els.video.src = media.video;
  els.video.load();

  let state = '';
  function show(name) {
    state = name;
    body.className = 'state-' + name;
    for (const s of [els.splash, els.intro, els.cards, els.ar]) s.classList.toggle('is-on', s.id === name || (name === 'help' && s.id === 'ar'));
    if (name === 'help') els.cards.classList.add('is-on');
    els.intro.setAttribute('aria-hidden', name !== 'intro');
  }

  // ---------- 1. splash ----------
  function startIntro() {
    if (state !== 'splash') return;
    const v = els.video;
    v.muted = false; v.volume = 1;
    // play() must be called inside the tap so audio is allowed
    const p = v.play();
    show('intro');
    if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(() => endIntro()); });
    setTimeout(() => { if (state === 'intro') { els.skip.hidden = false; els.skip.classList.add('fade-in'); } }, T.skipAppearsAfter);
  }
  els.splash.addEventListener('click', startIntro);

  // ---------- 2. intro ----------
  let introDone = false;
  async function endIntro(skipped) {
    if (introDone) return; introDone = true;
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
  }

  async function waitForAR() {
    while (!window.HMANE_AR) await new Promise(r => setTimeout(r, 50));
    return window.HMANE_AR;
  }

  async function enterAR() {
    show('ar');
    els.begin.hidden = true;
    fade(els.galleries, false, 300);
    setHint(false);
    setStatus(TXT.startingCamera, { loading: true });
    const AR = await waitForAR();
    if (!arMounted) {
      arMounted = true;
      AR.onReady = () => setStatus('');
      AR.onError = () => setStatus(TXT.cameraError, { retry: true });
      AR.onFoundChange = (any) => setHint(any);
      AR.onTap = openExperience;
      AR.mount(els.stage);
    }
    await AR.start();
  }
  els.retry.addEventListener('click', () => { location.href = location.pathname + '?start=ar'; });

  // help overlay ("?") — the Galleries card on top of the camera
  els.help.addEventListener('click', () => {
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
      body.classList.add('in-experience');
    }, 280);                                       // let the tap flash read first
  }
  function closeExperience() {
    if (!inExperience) return;
    inExperience = null;
    els.frame.src = 'about:blank';
    els.exp.hidden = true;
    body.classList.remove('in-experience');
    show('ar'); setHint(false);
    setStatus(TXT.startingCamera, { loading: true });
    window.HMANE_AR.start();
  }
  els.expClose.addEventListener('click', closeExperience);
  // An experience can send the visitor back itself when it finishes:
  //   window.parent.postMessage({ type: 'hmane:experience-complete' }, '*');
  window.addEventListener('message', (e) => {
    if (e.source !== els.frame.contentWindow) return;
    const t = e.data && e.data.type;
    if (t === 'hmane:experience-complete' || t === 'hmane:exit') closeExperience();
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
    const arm = () => { clearTimeout(idle); idle = setTimeout(() => { if (state !== 'splash' && !inExperience) location.href = location.pathname; }, CFG.idleResetMinutes * 60000); };
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
        ...CFG.objects.map(o => {
          const s = st[o.targetIndex];
          return o.id + ': ' + (s ? (s.showing ? 'TRACKED' : s.isTracking ? 'locking…' : 'searching') : '—');
        })
      ].join('\n');
    }, 300);
  }

  // ---------- go ----------
  if (params.get('start') === 'ar') { introDone = true; els.video.removeAttribute('src'); enterAR(); }
  else show('splash');
})();
