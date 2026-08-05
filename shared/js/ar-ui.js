/* ── hmane-ar shared UI controller ──────────────────────────────────────
   Wires up the overlay chrome around a MindAR A-Frame scene:
     • start gate (required — iOS will not grant camera or audio without
       a user gesture)
     • target found / lost messaging
     • audio narration toggle
     • Web Speech text-to-speech for the instruction copy
   No build step, no dependencies. Loaded with a plain <script> tag.
   -------------------------------------------------------------------- */

(function () {
  'use strict';

  const ARUI = {};

  /* ---- tiny helpers ------------------------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const announce = (msg) => {
    const live = $('#ar-live');
    if (live) live.textContent = msg;
  };

  /* ---- text-to-speech ---------------------------------------------- */
  const speech = {
    supported: 'speechSynthesis' in window,
    speaking: false,
    speak(text) {
      if (!this.supported) return false;
      this.stop();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.onend = () => { this.speaking = false; document.dispatchEvent(new Event('ar:tts-end')); };
      this.speaking = true;
      window.speechSynthesis.speak(u);
      return true;
    },
    stop() {
      if (!this.supported) return;
      window.speechSynthesis.cancel();
      this.speaking = false;
    }
  };
  ARUI.speech = speech;

  /* ---- main init ---------------------------------------------------- */
  ARUI.init = function init(opts) {
    const cfg = Object.assign({
      sceneSelector:  '#ar-scene',
      loaderSelector: '#ar-loader',
      startSelector:  '#ar-start',
      cardSelector:   '#ar-card',
      scanSelector:   '#ar-scan',
      audioSelector:  '#ar-audio',       // <audio> element, optional
      audioBtnSelector: '#ar-audio-btn', // toggle button, optional
      ttsBtnSelector: '#ar-tts-btn',     // toggle button, optional
      instructionsSelector: '#ar-instructions', // text read by TTS
      onTargetFound: null,
      onTargetLost:  null
    }, opts || {});

    const scene   = $(cfg.sceneSelector);
    const loader  = $(cfg.loaderSelector);
    const startEl = $(cfg.startSelector);
    const card    = $(cfg.cardSelector);
    const scan    = $(cfg.scanSelector);
    const audio   = $(cfg.audioSelector);
    const audioBtn= $(cfg.audioBtnSelector);
    const ttsBtn  = $(cfg.ttsBtnSelector);

    if (!scene) { console.error('[ar-ui] scene not found:', cfg.sceneSelector); return; }

    /* Hold MindAR back until the user taps Start. Autostart is disabled in
       the markup (mindar-image="autoStart: false"), which is what makes the
       camera prompt fire from a real gesture — required on iOS Safari. */
    const startAR = () => {
      const sys = scene.systems && scene.systems['mindar-image-system'];
      if (sys) {
        sys.start();
      } else {
        console.error('[ar-ui] mindar-image-system not registered — check that the MindAR script tag loaded after A-Frame.');
        announce('Could not start the camera. Please reload the page.');
        return;
      }
      if (loader) {
        loader.classList.add('is-out');
        setTimeout(() => { loader.hidden = true; }, 400);
      }
      if (scan) scan.hidden = false;
      announce('Camera started. Point your device at the target image.');
      // Priming the audio element inside the gesture keeps iOS happy later.
      if (audio) { audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {}); }
    };

    if (startEl) startEl.addEventListener('click', startAR, { once: true });

    /* Enable the start button once the scene is ready. MindAR registers its
       system on renderstart; 'loaded' is the fallback for older A-Frame. */
    let ready = false;
    function markReady() {
      if (ready) return;
      ready = true;
      if (startEl) {
        startEl.disabled = false;
        startEl.textContent = startEl.dataset.readyLabel || 'Start experience';
      }
      const spin = loader && $('.ar-spinner', loader);
      if (spin) spin.style.display = 'none';
    }
    scene.addEventListener('renderstart', markReady);
    if (scene.hasLoaded) { markReady(); } else { scene.addEventListener('loaded', markReady); }

    /* MindAR's own lifecycle events. */
    scene.addEventListener('arReady', () => announce('Tracking ready. Point your device at the target image.'));
    scene.addEventListener('arError', () => {
      announce('The AR engine failed to start. Check that the page is served over HTTPS and that the .mind file path is correct.');
      console.error('[ar-ui] arError — usually a bad imageTargetSrc path or a blocked camera.');
    });

    /* ---- target tracking events ------------------------------------ */
    document.querySelectorAll('[mindar-image-target]').forEach((target, i) => {
      target.addEventListener('targetFound', () => {
        if (scan) scan.hidden = true;
        if (card) card.hidden = false;
        announce('Target found.');
        if (audio && audioBtn && audioBtn.getAttribute('aria-pressed') === 'true') {
          audio.play().catch(() => {});
        }
        if (typeof cfg.onTargetFound === 'function') cfg.onTargetFound(i, target);
      });
      target.addEventListener('targetLost', () => {
        if (scan) scan.hidden = false;
        announce('Target lost. Move back over the image.');
        if (audio) audio.pause();
        if (typeof cfg.onTargetLost === 'function') cfg.onTargetLost(i, target);
      });
    });

    /* ---- audio toggle ---------------------------------------------- */
    if (audioBtn && audio) {
      audioBtn.setAttribute('aria-pressed', 'true');
      audioBtn.addEventListener('click', () => {
        const on = audioBtn.getAttribute('aria-pressed') === 'true';
        audioBtn.setAttribute('aria-pressed', String(!on));
        audioBtn.textContent = on ? '🔇' : '🔊';
        audioBtn.setAttribute('aria-label', on ? 'Turn narration audio on' : 'Turn narration audio off');
        if (on) { audio.pause(); } else { audio.play().catch(() => {}); }
      });
    }

    /* ---- text-to-speech toggle ------------------------------------- */
    if (ttsBtn) {
      if (!speech.supported) {
        ttsBtn.hidden = true;
      } else {
        ttsBtn.addEventListener('click', () => {
          if (speech.speaking) {
            speech.stop();
            ttsBtn.setAttribute('aria-pressed', 'false');
            return;
          }
          const src = $(cfg.instructionsSelector);
          const text = src ? src.innerText.trim() : '';
          if (text) {
            speech.speak(text);
            ttsBtn.setAttribute('aria-pressed', 'true');
          }
        });
        document.addEventListener('ar:tts-end', () => ttsBtn.setAttribute('aria-pressed', 'false'));
      }
    }

    /* ---- graceful failure ------------------------------------------ */
    window.addEventListener('error', (e) => {
      if (String(e.message || '').match(/camera|getUserMedia|Permission/i)) {
        announce('Camera unavailable. Check that the page is served over HTTPS and camera permission is granted.');
      }
    });

    return { start: startAR };
  };

  window.ARUI = ARUI;
})();
