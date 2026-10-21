/* HMANE Central Portal — configuration
 * Everything you are likely to tweak lives here: copy, timing, objects, links, halo look, tracking.
 * Outlines are traced from the reference images in assets/targets/ and are given as
 * normalized [u, v] points (0–1, origin = top-left of the reference image).
 */
window.HMANE_CONFIG = {
  // ---- Text (coded UI, not baked into the video) ----
  text: {
    tapToBegin: 'Tap to begin',
    skip: 'Skip intro',
    welcomeTitle: ['Welcome to the', 'HMANE Digital Museum'],
    galleriesTitle: 'In the Galleries',
    galleriesBody: ['Hold your device up to the gallery', '& tap on highlighted objects.'],
    begin: 'Begin',
    resume: 'Continue',
    hintSearching: 'Hold your device up to one of these objects',
    hintFound: 'Tap the glowing object to explore',
    startingCamera: 'Starting camera…',
    cameraError: 'We need your camera to show the gallery overlays. Please allow camera access and try again.',
    retry: 'Try again',
    backToPortal: 'Portal',
    openedInNewTab: 'Opened in a new tab. Come back here when you’re done.'
  },

  // ---- Intro media ----
  // Landscape screens (museum tablets) get the 16:9 assets; portrait screens (phones) get 9:16.
  media: {
    portrait:  { video: 'assets/video/intro-phone.mp4',  splash: 'assets/img/splash-phone.jpg'  },
    landscape: { video: 'assets/video/intro-tablet.mp4', splash: 'assets/img/splash-tablet.jpg' }
  },

  // ---- Timing (ms) — matches the reference edit ----
  timing: {
    skipAppearsAfter: 3000,
    afterVideoPause: 700,     // black hold between video end and the Welcome card
    welcomeFadeIn: 1000,
    welcomeHold: 2250,
    welcomeFadeOut: 750,
    galleriesFadeIn: 750,
    beginButtonDelay: 600
  },

  // ---- Clickable objects (order = target order inside assets/targets/targets.mind) ----
  objects: [
    {
      id: 'rosetta',
      title: 'Rashid (Rosetta) Stone',
      targetIndex: 0,
      url: 'https://jakesheykhetart.github.io/hmane_webar/experiences/rosetta-stone/',
      open: 'iframe',            // loads inside the portal; the user comes straight back to live AR
      thumb: 'assets/img/thumb-rosetta.jpg',
      target: { w: 755, h: 1400 },   // reference image size in px (sets the aspect ratio)
      // Full stela outline (drawn outline + replica fragment), not just the fragment
      outline: [[0.3462,0.0],[0.226,0.0299],[0.1382,0.054],[0.0914,0.0792],[0.090,0.21],[0.0914,0.4771],
                [0.0734,0.4938],[0.0619,0.6106],[0.060,0.70],[0.0489,0.783],[0.0446,0.995],[0.680,0.995],
                [0.8444,0.9383],[0.9329,0.8905],[0.9581,0.8657],[0.955,0.58],[0.947,0.56],[0.947,0.21],
                [0.9531,0.0823],[0.8768,0.0474],[0.7148,0.0113],[0.7004,0.0]]
    },
    {
      id: 'dream-stela',
      title: 'Dream Stela of Thutmose IV',
      targetIndex: 1,
      url: 'https://lens.snap.com/experience/7079c630-8eac-4e1c-aa23-5d5da8810fce',
      open: 'tab',               // Snap lens: opens in a new tab (rebuild in-portal later)
      thumb: 'assets/img/thumb-dream-stela.jpg',
      target: { w: 1000, h: 1122 },
      outline: [[0.927,0.1637],[0.8305,0.0957],[0.729,0.0538],[0.5831,0.0329],[0.3616,0.0419],[0.2601,0.0606],
                [0.1737,0.0882],[0.0797,0.148],[0.0487,0.1862],[0.0445,0.2041],[0.0495,0.5129],[0.0419,0.5548],
                [0.0453,0.7432],[0.0369,0.8546],[0.0495,0.9571],[0.0797,0.9645],[0.9581,0.9608],[0.9606,0.6094],
                [0.953,0.56],[0.9471,0.1877]]
    }
  ],

  // ---- Halo look (sizes are fractions of the object's average side, so tall and wide objects match) ----
  halo: {
    color: '#ffffff',
    coreWidth: 0.012,   // solid white line
    glowWidth: 0.035,   // soft glow radius
    pulseMs: 1800,      // gentle breathing so it reads as tappable
    pulseDepth: 0.2,    // 0 = no pulse, 1 = full fade
    fadeInMs: 450,
    smoothing: 3,       // corner rounding passes on the outline
    textureSize: 1024
  },

  // ---- Tracking (MindAR) — tune on site ----
  tracking: {
    targets: 'assets/targets/targets.mind',
    maxTrack: 2,          // both objects can be tracked at once
    filterMinCF: 0.0005,  // lower = steadier halo when still
    filterBeta: 50,       // higher = less lag when moving
    warmupTolerance: 3,
    missTolerance: 8,
    // Ask for an HD camera feed. MindAR's default (~640 px) is too small to recognise objects
    // from more than a step or two away.
    cameraWidth: 1280,
    cameraHeight: 720
  },

  // ---- Halo smoothing (removes tracking jitter) ----
  smoothing: {
    stillMs: 260,       // how slowly the halo settles while the phone is held still (higher = steadier)
    movingMs: 50,       // how quickly it follows real movement (lower = less lag)
    stillBelow: 0.006,  // pose differences below this (fraction of object width) count as jitter
    movingAbove: 0.06   // differences above this count as real movement
  },

  // Museum tablets: return to the splash after this many minutes without interaction (0 = off)
  idleResetMinutes: 0
};
