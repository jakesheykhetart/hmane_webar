/* HMANE Central Portal — live AR layer (A-Frame + MindAR image tracking)
 * Each clickable object is a MindAR image target. A glowing outline is drawn once into a
 * texture and pinned to the tracked target, so it follows the object's edges in perspective
 * as the visitor moves. Taps are ray-cast against an invisible plate the shape of the object.
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

  function buildHaloTexture(local, aspect, H) {
    const size = Math.sqrt(aspect);                 // geometric mean of width and height (width = 1)
    const core = H.coreWidth * size, glow = H.glowWidth * size;
    const pad = glow * 2.5;
    const W = 1 + 2 * pad, Ht = aspect + 2 * pad;
    const scale = H.textureSize / Math.max(W, Ht);
    const cw = Math.ceil(W * scale), ch = Math.ceil(Ht * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const path = new Path2D();
    local.forEach(([x, y], i) => {
      const px = (x + W / 2) * scale, py = (Ht / 2 - y) * scale;
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
    return { tex, W, Ht };
  }
  function hexToRgb(h) {
    const n = parseInt(h.replace('#', ''), 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }

  // ---------- halo component ----------
  AFRAME.registerComponent('hmane-halo', {
    schema: { object: { type: 'string' } },
    init() {
      const obj = CFG.objects.find(o => o.id === this.data.object);
      const H = CFG.halo;
      this.obj = obj;
      const aspect = obj.target.h / obj.target.w;
      const local = toLocal(chaikin(obj.outline, H.smoothing), aspect);

      const { tex, W, Ht } = buildHaloTexture(local, aspect, H);
      this.mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(W, Ht), this.mat);
      halo.renderOrder = 10;
      this.el.setObject3D('halo', halo);

      // invisible tap plate in the object's shape, slightly enlarged for forgiving taps
      const cx = local.reduce((s, p) => s + p[0], 0) / local.length;
      const cy = local.reduce((s, p) => s + p[1], 0) / local.length;
      const shape = new THREE.Shape(local.map(([x, y]) => new THREE.Vector2(cx + (x - cx) * 1.06, cy + (y - cy) * 1.06)));
      const hit = new THREE.Mesh(new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      hit.userData.objectId = obj.id;
      this.el.setObject3D('hit', hit);
      this.hit = hit;

      this.found = false; this.foundAt = 0; this.flashAt = -1e9;
      const anchor = this.el.parentEl;
      anchor.addEventListener('targetFound', () => { this.found = true; this.foundAt = performance.now(); AR._onFound(obj.id, true); });
      anchor.addEventListener('targetLost', () => { this.found = false; this.mat.opacity = 0; AR._onFound(obj.id, false); });
      AR._halos.push(this);
    },
    flash() { this.flashAt = performance.now(); },
    tick() {
      if (!this.found) return;
      const H = CFG.halo, now = performance.now();
      const fade = Math.min(1, (now - this.foundAt) / H.fadeInMs);
      const pulse = 1 - H.pulseDepth * 0.5 * (1 - Math.cos((now / H.pulseMs) * Math.PI * 2));
      const flash = Math.max(0, 1 - (now - this.flashAt) / 350);
      this.mat.opacity = Math.min(1, fade * pulse + flash);
      const s = 1 + 0.03 * flash;
      this.el.getObject3D('halo').scale.set(s, s, 1);
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

  // ---------- AR controller ----------
  const AR = window.HMANE_AR = {
    _halos: [],
    _found: new Set(),
    sceneEl: null,
    running: false,
    onFoundChange: null,   // (anyFound:boolean) => void
    onTap: null,           // (objectConfig) => void
    onReady: null,
    onError: null,

    mount(stage) {
      if (this.sceneEl) return;
      const T = CFG.tracking;
      const anchors = CFG.objects.map(o =>
        `<a-entity mindar-image-target="targetIndex: ${o.targetIndex}"><a-entity hmane-halo="object: ${o.id}"></a-entity></a-entity>`).join('');
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
      this.sceneEl.addEventListener('arReady', () => { this.running = true; this.onReady && this.onReady(); });
      this.sceneEl.addEventListener('arError', (e) => { this.running = false; this.onError && this.onError(e.detail); });
      this._bindTaps(stage);
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
      this._found.clear();
      this.onFoundChange && this.onFoundChange(false);
    },

    _sys() { return this.sceneEl.systems['mindar-image-system']; },

    _onFound(id, on) {
      on ? this._found.add(id) : this._found.delete(id);
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
        const live = this._halos.filter(h => h.found);
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
