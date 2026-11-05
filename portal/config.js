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

  // ---- Clickable objects ----
  objects: [
    {
      id: 'rosetta',
      title: 'Rashid (Rosetta) Stone',
      url: 'https://jakesheykhetart.github.io/hmane_webar/experiences/rosetta-stone/',
      open: 'iframe',            // loads inside the portal; the user comes straight back to live AR
      thumb: 'assets/img/thumb-rosetta.png',
      // Tracking views: photos/frames from the gallery at different angles and distances.
      // index = position in assets/targets/targets.mind; outline = the FULL stela outline
      // (drawn outline + replica fragment) in that view's own image coordinates.
      targets: [
        { index: 0, name: 'front', w: 600, h: 800,
          outline: [[0.2825,-0.804],[0.1073,-0.7302],[-0.018,-0.6713],[-0.0804,-0.6091],[-0.0484,-0.2995],[0.0117,0.2306],[-0.007,0.2598],[0.0019,0.4547],[0.016,0.5924],[0.0181,0.7124],[0.0474,0.9885],[0.6822,0.9787],[0.8497,0.9076],[0.9446,0.8466],[0.9739,0.8145],[1.0229,0.4053],[1.018,0.3733],[1.0995,-0.2783],[1.1443,-0.569],[1.0482,-0.6577],[0.825,-0.7569],[0.8059,-0.7873]] },
        { index: 1, name: 'close-up text', w: 600, h: 800,
          outline: [[-0.1976,-2.1739],[-0.5912,-2.037],[-0.877,-1.9233],[-1.0172,-1.7893],[-0.9049,-1.0752],[-0.7087,0.0983],[-0.7478,0.1611],[-0.7072,0.577],[-0.6616,0.8665],[-0.6448,1.1162],[-0.5538,1.6791],[0.7589,1.5972],[1.0838,1.4453],[1.2647,1.3207],[1.32,1.2571],[1.4056,0.4587],[1.3955,0.3956],[1.543,-0.9179],[1.6271,-1.5187],[1.4357,-1.72],[0.9788,-1.9698],[0.938,-2.0396]] },
        { index: 2, name: 'left angle', w: 537, h: 800,
          outline: [[0.246,-0.3437],[0.1792,-0.2478],[0.1366,-0.1834],[0.1174,-0.1362],[0.1337,0.0235],[0.1664,0.3236],[0.1601,0.3423],[0.1679,0.4621],[0.1766,0.5499],[0.1804,0.6279],[0.1996,0.8177],[0.5679,0.9571],[0.7124,0.9393],[0.8063,0.9035],[0.836,0.876],[0.8399,0.4218],[0.8302,0.3873],[0.8403,-0.3003],[0.8542,-0.6027],[0.7437,-0.6121],[0.548,-0.5509],[0.5323,-0.5624]] },
        { index: 3, name: 'right angle', w: 565, h: 800,
          outline: [[0.4582,-0.8146],[0.3057,-0.9041],[0.167,-0.9778],[0.0837,-0.9778],[0.1086,-0.543],[0.154,0.1409],[0.13,0.1721],[0.1305,0.4074],[0.1401,0.57],[0.1362,0.7108],[0.1559,1.0188],[0.6254,0.7952],[0.7016,0.7132],[0.7401,0.659],[0.7518,0.6347],[0.7814,0.3711],[0.7807,0.3508],[0.8267,-0.0465],[0.8487,-0.213],[0.8225,-0.2958],[0.7477,-0.4448],[0.7413,-0.4747]] },
        { index: 4, name: 'side-on with panels', w: 227, h: 800,
          outline: [[0.465,0.1136],[0.4034,0.1147],[0.354,0.1169],[0.3263,0.126],[0.3269,0.2071],[0.3304,0.3646],[0.3201,0.3738],[0.3148,0.4397],[0.3148,0.489],[0.3094,0.5344],[0.3094,0.6456],[0.5868,0.5912],[0.6403,0.5594],[0.6674,0.5371],[0.6752,0.5268],[0.6811,0.4175],[0.6793,0.4096],[0.6883,0.2666],[0.6934,0.2125],[0.6712,0.1916],[0.6179,0.1609],[0.6129,0.1541]] }
      ]
    },
    {
      id: 'dream-stela',
      title: 'Dream Stela of Thutmose IV',
      url: 'https://lens.snap.com/experience/7079c630-8eac-4e1c-aa23-5d5da8810fce',
      open: 'tab',               // Snap lens: opens in a new tab (rebuild in-portal later)
      thumb: 'assets/img/thumb-dream-stela.png',
      targets: [
        { index: 5, name: 'front', w: 650, h: 800,
          outline: [[0.9186,0.1447],[0.8334,0.0821],[0.7406,0.0413],[0.6027,0.0179],[0.3856,0.0203],[0.2837,0.0357],[0.1963,0.0603],[0.1023,0.1164],[0.0726,0.1528],[0.0696,0.17],[0.0974,0.4558],[0.0927,0.4932],[0.1091,0.6563],[0.1084,0.7498],[0.1272,0.833],[0.1564,0.8373],[0.9267,0.7926],[0.9369,0.5205],[0.9317,0.4808],[0.9357,0.1662]] },
        { index: 6, name: 'close-up left figure', w: 600, h: 800,
          outline: [[2.7235,-0.1839],[2.4073,-0.3736],[2.0614,-0.486],[1.5538,-0.5259],[0.7834,-0.4584],[0.4361,-0.3823],[0.1472,-0.2824],[-0.1506,-0.0863],[-0.2392,0.0313],[-0.2457,0.0839],[-0.1081,0.9185],[-0.1164,1.0248],[-0.0401,1.4754],[-0.0279,1.7277],[0.0409,1.9477],[0.1295,1.9593],[2.6497,1.8323],[2.7294,1.0222],[2.7167,0.9],[2.7857,-0.1159]] },
        { index: 7, name: 'close-up right figure', w: 600, h: 800,
          outline: [[0.8371,-0.1445],[0.5605,-0.312],[0.2612,-0.4236],[-0.1878,-0.494],[-0.9228,-0.5027],[-1.284,-0.4677],[-1.6045,-0.4043],[-1.966,-0.2481],[-2.0872,-0.1422],[-2.1024,-0.0914],[-2.0499,0.7933],[-2.0766,0.9153],[-2.043,1.459],[-2.0657,1.7856],[-2.0033,2.0782],[-1.8799,2.0847],[1.015,1.7223],[0.9803,0.8958],[0.954,0.7812],[0.8945,-0.0875]] },
        { index: 8, name: 'steep left angle', w: 339, h: 800,
          outline: [[0.8126,0.0626],[0.6897,0.0239],[0.5793,0.0166],[0.4481,0.0411],[0.2945,0.0998],[0.2381,0.1316],[0.1956,0.1633],[0.1556,0.2125],[0.1444,0.2385],[0.1435,0.2494],[0.1627,0.4262],[0.1618,0.4495],[0.1731,0.5526],[0.1754,0.6114],[0.1858,0.6664],[0.1989,0.6738],[0.8549,0.8484],[0.8588,0.5195],[0.8485,0.4702],[0.8405,0.0823]] },
        { index: 9, name: 'close-up inscription', w: 600, h: 800,
          outline: [[2.9391,-0.8414],[2.7092,-1.1044],[2.418,-1.2927],[1.9313,-1.4246],[1.0973,-1.4648],[0.6872,-1.4189],[0.3304,-1.3264],[-0.0516,-1.0939],[-0.1677,-0.9401],[-0.1773,-0.8669],[-0.0347,0.2317],[-0.0479,0.3589],[0.0228,0.8773],[0.0269,1.1509],[0.0922,1.3789],[0.1848,1.3878],[2.4624,1.2009],[2.6794,0.4432],[2.6941,0.3219],[2.9752,-0.7567]] }
      ]
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
    cameraHeight: 720,
    cameraFovLongSide: 62,     // degrees across the camera frame's long side (typical phone main lens)
    highDetailTracking: true   // track from 256 px reference images (much better lock-on; slightly more work)
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
