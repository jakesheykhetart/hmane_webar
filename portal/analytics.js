/* HMANE Central Portal — visitor analytics (PostHog)
 *
 * Answers three questions for HMANE:
 *   1. How many people visit   → portal_loaded (every page load) and visit_started (every visit)
 *   2. Where they go           → object_recognized / object_viewed / object_opened, per object
 *   3. How long they spend     → time_spent (per screen), object_viewed (seconds the object was in view),
 *                                experience_closed (seconds inside an experience)
 *
 * Privacy: no cookies, no localStorage, no names or emails, no camera images. PostHog keeps its
 * anonymous id in sessionStorage, which belongs to one browser tab and is wiped when it closes.
 *
 * Settings live in config.js → analytics. With no key, nothing is sent.
 * URL switches:
 *   ?debug=1    print events to the console instead of sending them (add &track=1 to send as well)
 *   ?notrack=1  stop counting this device for good (your own phones / test devices); ?notrack=0 undoes it
 *   ?src=nfc    where the visitor came from (put it on the NFC tags); defaults to "direct"
 */
(function () {
  const CFG = window.HMANE_CONFIG || {};
  const AC = Object.assign({ enabled: true, key: '', host: 'https://us.i.posthog.com',
                             visitTimeoutMinutes: 30, idleCapMinutes: 10, flushSeconds: 60 }, CFG.analytics || {});
  const params = new URLSearchParams(location.search);
  const debug = params.get('debug') === '1';

  // ---------- who gets counted ----------
  const store = (s) => { try { return window[s]; } catch (e) { return null; } };
  const LS = store('localStorage'), SS = store('sessionStorage');
  try {
    if (params.get('notrack') === '1') LS && LS.setItem('hmane:notrack', '1');
    if (params.get('notrack') === '0') LS && LS.removeItem('hmane:notrack');
  } catch (e) {}
  const optedOut = (() => { try { return !!LS && LS.getItem('hmane:notrack') === '1'; } catch (e) { return false; } })();
  const devHost = location.protocol === 'file:' || /^(localhost|127\.|10\.|192\.168\.)/.test(location.hostname);
  const forced = params.get('track') === '1';
  const SEND = !!(AC.enabled && AC.key) && !optedOut && (forced || (!debug && !devHost));

  // ---------- transport (PostHog loads after the page, so early events wait in a queue) ----------
  let ph = null, queue = [];
  function capture(name, props) {
    if (debug) console.log('%c[analytics]', 'color:#E8B05E', name, props || {});
    if (!SEND) return;
    if (ph) ph.capture(name, props); else queue.push([name, props]);
  }
  function loadPostHog() {
    if (!SEND) return;
    const s = document.createElement('script');
    s.async = true; s.crossOrigin = 'anonymous';
    s.src = AC.host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
    s.onload = () => {
      const P = window.posthog;
      if (!P || !P.init) return;
      P.init(AC.key, {
        api_host: AC.host,
        persistence: 'sessionStorage',    // no cookies; one tab = one visitor
        person_profiles: 'identified_only', // anonymous events only
        autocapture: false,               // we send our own named events
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        disable_surveys: true,
        loaded: (inst) => {
          ph = inst;
          ph.register(superProps());
          if (pendingReset) { ph.reset(); ph.register(superProps()); pendingReset = false; }
          queue.forEach(([n, p]) => ph.capture(n, p)); queue = [];
        }
      });
    };
    s.onerror = () => { queue = []; };   // blocked by an ad blocker or offline: carry on silently
    document.head.appendChild(s);
  }
  // Load once the page has settled, so analytics never competes with the intro video or tracking data.
  const later = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 1500));
  if (document.readyState === 'complete') later(loadPostHog); else addEventListener('load', () => later(loadPostHog), { once: true });

  // ---------- visits ----------
  // A visit is one person's use of the portal. It survives reloads in the same tab (e.g. "Try again"),
  // ends after visitTimeoutMinutes with nothing happening, and ends at the tablets' idle reset.
  const VISIT_KEY = 'hmane:visit';
  const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  let visit = null, pendingReset = false;
  function saveVisit() { try { SS && SS.setItem(VISIT_KEY, JSON.stringify(visit)); } catch (e) {} }
  function loadVisit() { try { return JSON.parse((SS && SS.getItem(VISIT_KEY)) || 'null'); } catch (e) { return null; } }

  const shortSide = Math.min(screen.width, screen.height);
  const device = shortSide >= 600 ? 'tablet' : 'phone';
  const entry = params.get('src') || 'direct';
  function superProps() {
    return { visit_id: visit && visit.id, device, entry, app: 'hmane-portal' };
  }

  function startVisit(reason) {
    visit = { id: rid(), started: Date.now(), last: Date.now(), found: [] };
    saveVisit();
    if (ph) ph.register(superProps());
    capture('visit_started', Object.assign({ reason }, superProps()));
  }
  function touch() { if (visit) { visit.last = Date.now(); saveVisit(); } lastActivity = performance.now(); }

  const prev = loadVisit();
  if (prev && Date.now() - prev.last < AC.visitTimeoutMinutes * 60000) visit = prev;
  const newVisit = !visit;
  if (newVisit) startVisit('page_load');
  capture('portal_loaded', Object.assign({
    start: params.get('start') === 'ar' ? 'ar' : 'splash',
    orientation: innerWidth > innerHeight ? 'landscape' : 'portrait',
    new_visit: newVisit
  }, superProps()));

  // ---------- time ----------
  // Time is sent in small pieces (time_spent, with the screen it was spent on), so it is counted even
  // when a phone closes the tab without warning. Sum the seconds to get totals.
  let screenName = 'splash', segStart = performance.now(), lastActivity = performance.now();
  let visible = !document.hidden;
  const r1 = (s) => Math.round(s * 10) / 10;
  function flushTime() {
    if (!visible) return;
    const now = performance.now();
    const end = Math.min(now, lastActivity + AC.idleCapMinutes * 60000);   // stop counting a phone left lying around
    const secs = (end - segStart) / 1000;
    segStart = now;
    if (secs >= 0.5) capture('time_spent', { screen: screenName, seconds: r1(secs) });
  }
  setInterval(flushTime, AC.flushSeconds * 1000);
  ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, touch, { passive: true, capture: true }));

  // Experience that opened in a new tab (Snap lens): time it until the visitor comes back.
  let tabExp = null;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { flushTime(); endAllSpans(); visible = false; return; }
    visible = true; segStart = performance.now(); touch();
    if (tabExp) {
      capture('experience_closed', { object: tabExp.id, mode: 'tab', how: 'returned', seconds: r1((Date.now() - tabExp.t0) / 1000) });
      tabExp = null;
    }
  });
  addEventListener('pagehide', () => { flushTime(); endAllSpans(); });

  // ---------- objects in view ----------
  const objById = (id) => (CFG.objects || []).find(o => o.id === id) || { id, title: id };
  function viewName(halo) {
    if (!halo) return null;
    const obj = halo.obj || {}, v = (obj.targets || []).find(t => t.index === halo.targetIndex);
    return v ? v.name : String(halo.targetIndex);
  }
  const spans = {};      // object id -> { t0, view, endTimer }
  const GAP_MS = 2000;   // a tracking blip shorter than this doesn't split one look into two
  function endSpan(id) {
    const s = spans[id]; if (!s) return;
    clearTimeout(s.endTimer); delete spans[id];
    const secs = (s.lostAt || performance.now()) - s.t0;
    if (secs >= 1000) capture('object_viewed', { object: id, title: objById(id).title, view: s.view, seconds: r1(secs / 1000) });
  }
  function endAllSpans() { Object.keys(spans).forEach(endSpan); }
  function onObjectChange(AR, id) {
    const on = AR._found.has(id);
    const s = spans[id];
    if (on) {
      touch();
      if (s) { clearTimeout(s.endTimer); s.endTimer = null; s.lostAt = 0; return; }
      let view = viewName(AR._active[id]);
      if (!view && AR._sightView && AR._sightView[id] != null) {   // found by the search before the halo locked
        const t = (objById(id).targets || []).find(v => v.index === AR._sightView[id]); view = t ? t.name : String(AR._sightView[id]);
      }
      spans[id] = { t0: performance.now(), view };
      if (visit && visit.found.indexOf(id) < 0) {
        visit.found.push(id); saveVisit();
        capture('object_recognized', { object: id, title: objById(id).title, view });
      }
    } else if (s && !s.endTimer) {
      s.lostAt = performance.now();
      s.endTimer = setTimeout(() => endSpan(id), GAP_MS);
    }
  }
  // Hook into the AR layer without changing it: wrap its found/lost and stop calls.
  (function hookAR() {
    const AR = window.HMANE_AR;
    if (!AR) return setTimeout(hookAR, 100);
    const found = AR._onFound, stop = AR.stop;
    AR._onFound = function (id) { found.call(this, id); try { onObjectChange(this, id); } catch (e) {} };
    AR.stop = function () { endAllSpans(); return stop.apply(this, arguments); };
  })();

  // ---------- experiences ----------
  let exp = null;   // { id, t0, chapters }
  function watchFrame(frame) {
    frame.addEventListener('load', () => {
      if (!exp) return;
      let doc;
      try { doc = frame.contentDocument; } catch (e) { return; }   // other site: can't look inside
      if (!doc || !/^https?:/.test(doc.location.href)) return;
      // The Rosetta experience announces each finished chapter with this event.
      doc.addEventListener('hmane:chapter-complete', (e) => {
        const ch = e.detail && e.detail.chapter;
        if (!exp || !ch) return;
        touch();
        exp.chapters = Math.max(exp.chapters, ch);
        capture('chapter_completed', { object: exp.id, chapter: ch });
      });
      // taps inside the experience count as activity for the idle cap
      doc.addEventListener('pointerdown', touch, { passive: true, capture: true });
    });
  }

  // ---------- public API used by portal.js ----------
  window.HMANE_ANALYTICS = {
    track(name, props) { touch(); capture(name, props); },
    screen(name) { if (name === screenName) return; flushTime(); screenName = name; },
    experienceOpened(obj) {
      touch();
      capture('object_opened', { object: obj.id, title: obj.title, mode: obj.open });
      if (obj.open === 'tab') tabExp = { id: obj.id, t0: Date.now() };
      else exp = { id: obj.id, t0: Date.now(), chapters: 0 };
    },
    experienceClosed(how) {
      if (!exp) return;
      touch();
      const p = { object: exp.id, mode: 'iframe', how, seconds: r1((Date.now() - exp.t0) / 1000) };
      if (exp.chapters) p.chapters_completed = exp.chapters;
      capture('experience_closed', p);
      exp = null;
    },
    watchFrame,
    // Tablets: called just before the idle reset sends the screen back to the splash.
    endVisit(reason) {
      flushTime(); endAllSpans();
      if (exp) this.experienceClosed('idle_reset');
      capture('visit_ended', { reason, seconds: visit ? Math.round((Date.now() - visit.started) / 1000) : null });
      try { SS && SS.removeItem(VISIT_KEY); } catch (e) {}
      visit = null;
      if (ph) ph.reset(); else pendingReset = true;
    }
  };
})();
