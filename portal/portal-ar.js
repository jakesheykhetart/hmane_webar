/* HMANE Central Portal — live AR layer (A-Frame + MindAR image tracking)
 * Each clickable object has one or more MindAR image targets ("views": photos from different
 * angles and distances). Each view carries the object's outline in its own image coordinates, so
 * whichever view is recognised, the glowing outline lands exactly on the object's edges and follows
 * them in perspective. Only one halo per object is shown at a time. Taps are ray-cast against an
 * invisible plate the shape of the object.
 */
(function () {
  const CFG = window.HMANE_CONFIG;
  const THREE = AFRAME.THREE;

  // ---------- geometry helpers ----------
  function chaikin(pts, passes) {
    let p = pts;
    for (let k = 0; k < passes; k++) {
      const out = [];
      for (let i = 0; i < p.length; i++) {
        const a = p[i], b = p[(i + 1) % p.length];
        out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
        out.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
      }
      p = out;
    }
    return p;
  }
  // normalized [u,v] (top-left origin) -> anchor-local units (1 = image width, origin centre, y up)
  function toLocal(pts, aspect) {
    return pts.map(([u, v]) => [u - 0.5, (0.5 - v) * aspect]);
  }

  // The outline can extend past the view's image (close-up views), so the texture covers the outline's own box.
  function buildHaloTexture(local, H) {
    const xs = local.map(p => p[0]), ys = local.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const bw = maxX - minX, bh = maxY - minY, cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const size = Math.sqrt(bw * bh);                // object's average side, in this view's units
    const core = H.coreWidth * size, glow = H.glowWidth * size;
    const pad = glow * 2.5;
    const W = bw + 2 * pad, Ht = bh + 2 * pad;
    const scale = H.textureSize / Math.max(W, Ht);
    const cw = Math.ceil(W * scale), ch = Math.ceil(Ht * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const path = new Path2D();
    local.forEach(([x, y], i) => {
      const px = (x - cx + W / 2) * scale, py = (Ht / 2 - (y - cy)) * scale;
      i ? path.lineTo(px, py) : path.moveTo(px, py);
    });
    path.closePath();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const rgb = hexToRgb(H.color);
    // A thin line drawn repeatedly with a wide shadow gives a smooth gaussian glow (no banding),
    // then a tighter glow, then the solid core on top.
    const passes = [
      { w: core, blur: glow * 1.0, a: 0.9, n: 3 },
      { w: core, blur: glow * 0.35, a: 1.0, n: 2 },
      { w: core, blur: 0, a: 1.0, n: 1 }
    ];
    ctx.strokeStyle = `rgb(${rgb})`;
    ctx.lineWidth = Math.max(2, core * scale);
    for (const p of passes) {
      ctx.shadowColor = `rgba(${rgb},${p.a})`;
      ctx.shadowBlur = p.blur * scale;
      for (let i = 0; i < p.n; i++) ctx.stroke(path);
    }
    const tex = new THREE.CanvasTexture(canvas);
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { tex, W, Ht, cx, cy };
  }
  // A view = one image target of an object. Older single-target config entries still work.
  function viewsOf(obj) {
    return obj.targets || [{ index: obj.targetIndex, w: obj.target.w, h: obj.target.h, outline: obj.outline }];
  }
  function hexToRgb(h) {
    const n = parseInt(h.replace('#', ''), 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }

  // ---------- halo component ----------
  AFRAME.registerComponent('hmane-halo', {
    schema: { object: { type: 'string' }, view: { type: 'int', default: 0 } },
    init() {
      const obj = CFG.objects.find(o => o.id === this.data.object);
      const view = viewsOf(obj)[this.data.view];
      const H = CFG.halo;
      this.obj = obj; this.targetIndex = view.index;
      const aspect = view.h / view.w;
      const local = toLocal(chaikin(view.outline, H.smoothing), aspect);

      const { tex, W, Ht, cx: hx, cy: hy } = buildHaloTexture(local, H);
      this.mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(W, Ht), this.mat);
      halo.renderOrder = 10;
      halo.position.set(hx, hy, 0);
      this.haloMesh = halo;
      // The halo lives in its own group at scene level, driven by a smoothed copy of the tracked pose
      // (see tick), so tracking noise doesn't make the outline jump around.
      this.group = new THREE.Group();
      this.group.matrixAutoUpdate = false;
      this.group.visible = false;
      this.group.add(halo);
      this.el.sceneEl.object3D.add(this.group);
      this.anchor3D = this.el.parentEl.object3D;
      this.sp = new THREE.Vector3(); this.sq = new THREE.Quaternion(); this.ss = new THREE.Vector3();
      this.tp = new THREE.Vector3(); this.tq = new THREE.Quaternion(); this.ts = new THREE.Vector3();
      this.hasPose = false;

      // invisible tap plate in the object's shape, slightly enlarged for forgiving taps
      const cx = local.reduce((s, p) => s + p[0], 0) / local.length;
      const cy = local.reduce((s, p) => s + p[1], 0) / local.length;
      const shape = new THREE.Shape(local.map(([x, y]) => new THREE.Vector2(cx + (x - cx) * 1.06, cy + (y - cy) * 1.06)));
      const hit = new THREE.Mesh(new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      hit.userData.objectId = obj.id;
      this.group.add(hit);
      this.hit = hit;

      this.found = false; this.foundAt = 0; this.flashAt = -1e9;
      const anchor = this.el.parentEl;
      anchor.addEventListener('targetFound', () => {
        this.found = true;
        if (!AR._active[obj.id]) { AR._active[obj.id] = this; this.foundAt = performance.now(); }
        AR._onFound(obj.id);
      });
      anchor.addEventListener('targetLost', () => {
        this.found = false; this.mat.opacity = 0; this.hasPose = false; this.group.visible = false;
        if (AR._active[obj.id] === this) {          // hand over to another view of the same object, if any
          const next = AR._halos.find(h => h !== this && h.obj === obj && h.found) || null;
          AR._active[obj.id] = next;
          if (next) next.foundAt = performance.now() - CFG.halo.fadeInMs;   // no second fade-in
        }
        AR._onFound(obj.id);
      });
      AR._halos.push(this);
    },
    flash() { this.flashAt = performance.now(); },
    tick(t, dt) {
      if (!this.found || !this.anchor3D.visible || AR._active[this.obj.id] !== this) { this.group.visible = false; this.hasPose = false; return; }
      this._smoothPose(Math.min(dt || 16, 100));
      const H = CFG.halo, now = performance.now();
      const fade = Math.min(1, (now - this.foundAt) / H.fadeInMs);
      const pulse = 1 - H.pulseDepth * 0.5 * (1 - Math.cos((now / H.pulseMs) * Math.PI * 2));
      const flash = Math.max(0, 1 - (now - this.flashAt) / 350);
      this.mat.opacity = Math.min(1, fade * pulse + flash);
      const s = 1 + 0.03 * flash;
      this.haloMesh.scale.set(s, s, 1);
    },
    // Adaptive smoothing: small differences (tracking noise while the visitor holds still) are smoothed
    // heavily; large ones (the visitor actually moving) are followed quickly so the halo doesn't lag.
    _smoothPose(dt) {
      const S = CFG.smoothing || {};
      this.anchor3D.matrix.decompose(this.tp, this.tq, this.ts);
      if (!this.hasPose) {
        this.sp.copy(this.tp); this.sq.copy(this.tq); this.ss.copy(this.ts); this.hasPose = true;
      } else {
        const size = Math.max(1e-6, this.ts.x);                 // 1 unit = object width
        const err = this.sp.distanceTo(this.tp) / size + this.sq.angleTo(this.tq) * 0.6;
        const lo = S.stillBelow ?? 0.006, hi = S.movingAbove ?? 0.06;
        let k = Math.min(1, Math.max(0, (err - lo) / (hi - lo)));
        k = k * k * (3 - 2 * k);
        const tau = (S.stillMs ?? 260) + ((S.movingMs ?? 50) - (S.stillMs ?? 260)) * k;
        const a = 1 - Math.exp(-dt / tau);
        this.sp.lerp(this.tp, a); this.sq.slerp(this.tq, a); this.ss.lerp(this.ts, a);
      }
      this.group.matrix.compose(this.sp, this.sq, this.ss);
      this.group.matrixWorldNeedsUpdate = true;
      this.group.visible = true;
    }
  });

  // ---------- HD camera ----------
  // MindAR requests the camera with no size, which most phones answer with ~640x480.
  // Wrap getUserMedia so its request also asks for HD.
  (function patchCamera() {
    const md = navigator.mediaDevices;
    if (!md || !md.getUserMedia || md.__hmanePatched) return;
    const orig = md.getUserMedia.bind(md);
    md.getUserMedia = (c) => {
      if (c && c.video && typeof c.video === 'object' && !c.video.width) {
        const long = CFG.tracking.cameraWidth || 1280, short = CFG.tracking.cameraHeight || 720;
        const portrait = innerHeight > innerWidth;   // ask in the screen's orientation so nothing gets cropped
        c = Object.assign({}, c, { video: Object.assign({}, c.video, {
          width: { ideal: portrait ? short : long },
          height: { ideal: portrait ? long : short }
        }) });
      }
      return orig(c);
    };
    md.__hmanePatched = true;
  })();

  // ---------- tracker tuning (hooks in the vendored MindAR) ----------
  // Track from the 256 px reference image instead of MindAR's 128 px default: far more reliable lock-on
  // with real gallery photos, where the object is only part of the frame.
  window.HMANE_TRACK_KEYFRAME = CFG.tracking.highDetailTracking === false ? 1 : 0;
  // MindAR assumes a 45° field of view across the frame's height. On an upright phone the height is the
  // long side, where real phone cameras see ~60–70°, so poses were estimated with the wrong lens.
  window.HMANE_adjustController = (ctl) => {
    const fov = CFG.tracking.cameraFovLongSide;
    if (!fov) return;
    const W = ctl.inputWidth, H = ctl.inputHeight, f = (Math.max(W, H) / 2) / Math.tan(fov * Math.PI / 360);
    ctl.projectionTransform = [[f, 0, W / 2], [0, f, H / 2], [0, 0, 1]];
    ctl.projectionMatrix = ctl._glProjectionMatrix({ projectionTransform: ctl.projectionTransform, width: W, height: H, near: 10, far: 100000 });
  };

  // ---------- AR controller ----------
  const AR = window.HMANE_AR = {
    _halos: [],
    _found: new Set(),
    _active: {},           // object id -> the halo (view) currently shown for it
    sceneEl: null,
    running: false,
    onFoundChange: null,   // (anyFound:boolean) => void
    onTap: null,           // (objectConfig) => void
    onReady: null,
    onVideo: null,
    onError: null,

    mount(stage) {
      if (this.sceneEl) return;
      const T = CFG.tracking;
      const anchors = CFG.objects.map(o => viewsOf(o).map((v, k) =>
        `<a-entity mindar-image-target="targetIndex: ${v.index}"><a-entity hmane-halo="object: ${o.id}; view: ${k}"></a-entity></a-entity>`).join('')).join('');
      stage.innerHTML =
        `<a-scene embedded
            mindar-image="imageTargetSrc: ${T.targets}; maxTrack: ${T.maxTrack}; autoStart: false; uiLoading: no; uiScanning: no; uiError: no;
                          filterMinCF: ${T.filterMinCF}; filterBeta: ${T.filterBeta}; warmupTolerance: ${T.warmupTolerance}; missTolerance: ${T.missTolerance}"
            renderer="colorManagement: true; antialias: true; alpha: true; precision: mediump"
            vr-mode-ui="enabled: false" xr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false" loading-screen="enabled: false">
           <a-camera position="0 0 0" look-controls="enabled: false" wasd-controls="enabled: false"></a-camera>
           ${anchors}
         </a-scene>`;
      this.sceneEl = stage.querySelector('a-scene');
      this.sceneEl.addEventListener('arReady', () => {
        this.running = true;
        // Don't spend detection effort (or a tracking slot) on other views of an object that's already tracked
        const ctl = this._sys().controller;
        if (ctl) ctl.skipTarget = (idx) => {
          const h = this._halos.find(x => x.targetIndex === idx);
          return !!h && this._halos.some(x => x !== h && x.obj === h.obj && x.found);
        };
        this.onReady && this.onReady();
      });
      this.sceneEl.addEventListener('arError', (e) => { this.running = false; this.onError && this.onError(e.detail); });
      this._bindTaps(stage);
    },

    // Build the tracking engine's GPU programs and load the targets while the intro plays, so the
    // camera view is ready almost as soon as permission is granted. Safe to call more than once.
    prewarm() {
      if (this._warm) return this._warm;
      this._warm = (async () => {
        const t0 = performance.now();
        const portrait = innerHeight > innerWidth;
        const W = portrait ? (CFG.tracking.cameraHeight || 720) : (CFG.tracking.cameraWidth || 1280);
        const H = portrait ? (CFG.tracking.cameraWidth || 1280) : (CFG.tracking.cameraHeight || 720);
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const g = cv.getContext('2d'); g.fillStyle = '#777'; g.fillRect(0, 0, W, H);
        const C = new window.MINDAR.IMAGE.Controller({ inputWidth: W, inputHeight: H, maxTrack: CFG.tracking.maxTrack });
        await C.addImageTargets(CFG.tracking.targets);
        await C.dummyRun(cv);
        try { C.dispose(); if (C.worker && C.worker.terminate) C.worker.terminate(); } catch (e) {}
        this.warmMs = Math.round(performance.now() - t0);
      })().catch(e => console.warn('AR prewarm failed (will warm on start instead)', e));
      return this._warm;
    },

    _whenLoaded() {
      return new Promise(res => this.sceneEl.hasLoaded ? res() : this.sceneEl.addEventListener('loaded', res, { once: true }));
    },

    async start() {
      await this._whenLoaded();
      if (this.running) return;
      const sys = this._sys();
      sys.start();
      // MindAR sets the "muted" attribute but not the property; some browsers then refuse to autoplay the feed
      const v = sys.video;
      if (v) {
        v.muted = true; v.defaultMuted = true; v.playsInline = true;
        v.setAttribute('aria-hidden', 'true');
        v.addEventListener('loadedmetadata', () => v.play().catch(() => {}), { once: true });
        v.addEventListener('playing', () => this.onVideo && this.onVideo(), { once: true });
      }
    },

    stop() {
      if (!this.running) return;
      const sys = this._sys();
      try { sys.stop(); } catch (e) { console.warn('AR stop', e); }
      // reset anchors so the next detection fires targetFound again
      sys.anchorEntities.forEach(a => { try { a.el.updateWorldMatrix(null); } catch (e) {} });
      this.running = false;
      this._halos.forEach(h => { h.found = false; h.mat.opacity = 0; });
      this._active = {};
      this._found.clear();
      this.onFoundChange && this.onFoundChange(false);
    },

    _sys() { return this.sceneEl.systems['mindar-image-system']; },

    _onFound(id) {
      this._halos.some(h => h.obj.id === id && h.found) ? this._found.add(id) : this._found.delete(id);
      this.onFoundChange && this.onFoundChange(this._found.size > 0);
    },

    _bindTaps(stage) {
      const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
      let down = null;
      stage.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
      stage.addEventListener('pointerup', e => {
        if (!down) return;
        const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
        down = null;
        if (moved > 14 || dt > 800 || !this.running) return;
        const canvas = this.sceneEl.canvas, cam = this.sceneEl.camera;
        if (!canvas || !cam) return;
        const r = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, cam);
        const live = this._halos.filter(h => h.found && this._active[h.obj.id] === h);
        if (!live.length) return;
        const hits = ray.intersectObjects(live.map(h => h.hit), false);
        if (!hits.length) return;
        const halo = live.find(h => h.hit === hits[0].object);
        halo.flash();
        this.onTap && this.onTap(halo.obj);
      });
    }
  };
})();
