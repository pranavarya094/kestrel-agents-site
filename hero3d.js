/* Northlight hero: a small agent network. A core, orbiting agents, and work packets handed between them. */
(function () {
  var canvas = document.getElementById('stage');
  if (!canvas || !window.THREE) return;
  var hero = canvas.parentElement;
  var T = window.THREE;
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { hero.classList.add('nowebgl'); return; }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia('(max-width: 860px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 9.5);
  var world = new T.Group();
  scene.add(world);

  function glowTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.25, 'rgba(255,255,255,.55)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  }
  var glowTex = glowTexture();
  function glow(color, size, op) {
    var s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: color, transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending }));
    s.scale.set(size, size, 1); return s;
  }

  /* core */
  var core = new T.Group(); world.add(core);
  var shell = new T.Mesh(new T.IcosahedronGeometry(1.15, 1), new T.MeshBasicMaterial({ color: 0x5FE0F0, wireframe: true, transparent: true, opacity: 0.45 }));
  var inner = new T.Mesh(new T.IcosahedronGeometry(0.72, 0), new T.MeshBasicMaterial({ color: 0x8E7BFF, wireframe: true, transparent: true, opacity: 0.8 }));
  core.add(shell, inner, glow(0x8E7BFF, 5.2, 0.55), glow(0x5FE0F0, 2.6, 0.5));

  /* orbit rings */
  var ringDefs = [
    { r: 2.2, tilt: [1.1, 0.2], speed: 0.16 },
    { r: 3.0, tilt: [0.35, 0.9], speed: -0.11 },
    { r: 3.8, tilt: [-0.7, 0.4], speed: 0.08 }
  ];
  var rings = [];
  ringDefs.forEach(function (d) {
    var g = new T.Group(); g.rotation.set(d.tilt[0], d.tilt[1], 0);
    var m = new T.Mesh(new T.TorusGeometry(d.r, 0.006, 6, 160), new T.MeshBasicMaterial({ color: 0x96ACFF, transparent: true, opacity: 0.22 }));
    g.add(m); world.add(g); rings.push({ g: g, def: d, nodes: [] });
  });

  /* agents */
  var roles = [
    { c: 0x5FE0F0, ring: 0, a: 0.0 }, { c: 0x8E7BFF, ring: 0, a: 3.3 },
    { c: 0xFFC25E, ring: 1, a: 1.2 }, { c: 0x6EF0B0, ring: 1, a: 4.4 },
    { c: 0xFF8FA3, ring: 2, a: 2.2 }, { c: 0x7AA7FF, ring: 2, a: 5.3 }
  ];
  var agents = roles.map(function (r) {
    var holder = new T.Group();
    var mesh = new T.Mesh(new T.OctahedronGeometry(0.17, 0), new T.MeshBasicMaterial({ color: r.c }));
    holder.add(mesh, glow(r.c, 1.1, 0.7));
    rings[r.ring].g.add(holder);
    var o = { holder: holder, mesh: mesh, ring: r.ring, a: r.a, color: r.c, pos: new T.Vector3() };
    rings[r.ring].nodes.push(o);
    return o;
  });

  /* links core -> agent (live) */
  var linkGeo = new T.BufferGeometry();
  var linkPos = new Float32Array(agents.length * 6);
  linkGeo.setAttribute('position', new T.BufferAttribute(linkPos, 3));
  var links = new T.LineSegments(linkGeo, new T.LineBasicMaterial({ color: 0x96ACFF, transparent: true, opacity: 0.16 }));
  links.frustumCulled = false; world.add(links);

  /* work packets handed between agents */
  var packets = [];
  for (var i = 0; i < 3; i++) {
    var s = glow(0xffffff, 0.55, 0.95); s.visible = false; world.add(s);
    packets.push({ s: s, from: 0, to: 1, t: 1, wait: i * 0.9 });
  }
  var flash = [];
  function pickPair() {
    var a = Math.floor(Math.random() * agents.length), b;
    do { b = Math.floor(Math.random() * agents.length); } while (b === a);
    return [a, b];
  }

  /* dust */
  var N = small ? 260 : 620, pp = new Float32Array(N * 3);
  for (var k = 0; k < N; k++) {
    var rad = 5 + Math.random() * 11, th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
    pp[k * 3] = rad * Math.sin(ph) * Math.cos(th); pp[k * 3 + 1] = rad * Math.sin(ph) * Math.sin(th) * 0.7; pp[k * 3 + 2] = rad * Math.cos(ph);
  }
  var dustGeo = new T.BufferGeometry(); dustGeo.setAttribute('position', new T.BufferAttribute(pp, 3));
  var dust = new T.Points(dustGeo, new T.PointsMaterial({ color: 0xBFD0FF, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false }));
  scene.add(dust);

  /* sizing: object sits to the right on wide screens, behind the text on phones */
  function resize() {
    var w = hero.clientWidth, h = hero.clientHeight;
    small = w <= 860;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = small ? 12.5 : 9.5;
    camera.updateProjectionMatrix();
    world.position.x = small ? 0 : Math.min(3.1, w / 400);
    world.scale.setScalar(small ? 0.62 : 1);
    var vis = 2 * camera.position.z * Math.tan(21 * Math.PI / 180);
    world.position.y = small ? -((h / 2 - 190) / h) * vis : 0;
  }
  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(hero); else window.addEventListener('resize', resize);

  var mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2; my = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });

  var v = new T.Vector3(), clock = new T.Clock(), running = true, visible = true, raf = 0;

  function update(dt, t) {
    tx += (mx - tx) * 0.04; ty += (my - ty) * 0.04;
    world.rotation.y = t * 0.08 + tx * 0.35;
    world.rotation.x = ty * 0.22 + Math.sin(t * 0.2) * 0.08;
    shell.rotation.y += dt * 0.25; shell.rotation.x += dt * 0.12;
    inner.rotation.y -= dt * 0.5; inner.rotation.z += dt * 0.2;
    var pulse = 1 + Math.sin(t * 1.6) * 0.04; core.scale.setScalar(pulse);
    dust.rotation.y = t * 0.012;
    agents.forEach(function (o) {
      var d = rings[o.ring].def;
      o.a += dt * d.speed * 1.6;
      o.holder.position.set(Math.cos(o.a) * d.r, Math.sin(o.a) * d.r, 0);
      o.mesh.rotation.x += dt * 1.2; o.mesh.rotation.y += dt * 0.8;
    });
    world.updateMatrixWorld(true);
    agents.forEach(function (o, i) {
      o.holder.getWorldPosition(v); world.worldToLocal(v); o.pos.copy(v);
      linkPos[i * 6] = 0; linkPos[i * 6 + 1] = 0; linkPos[i * 6 + 2] = 0;
      linkPos[i * 6 + 3] = v.x; linkPos[i * 6 + 4] = v.y; linkPos[i * 6 + 5] = v.z;
    });
    linkGeo.attributes.position.needsUpdate = true;
    packets.forEach(function (p) {
      if (p.t >= 1) {
        p.wait -= dt;
        if (p.wait <= 0) { var pr = pickPair(); p.from = pr[0]; p.to = pr[1]; p.t = 0; p.s.visible = true; p.s.material.color.setHex(agents[p.from].color); }
        return;
      }
      p.t += dt / 1.6;
      if (p.t >= 1) { p.s.visible = false; p.wait = 0.8 + Math.random() * 1.4; agents[p.to].mesh.scale.setScalar(2.2); return; }
      var e = p.t * p.t * (3 - 2 * p.t);
      p.s.position.lerpVectors(agents[p.from].pos, agents[p.to].pos, e);
      p.s.position.multiplyScalar(1 + Math.sin(e * Math.PI) * 0.12);
    });
    agents.forEach(function (o) { var s = o.mesh.scale.x; if (s > 1) o.mesh.scale.setScalar(Math.max(1, s - dt * 2)); });
  }

  function frame() {
    raf = 0;
    if (!running || !visible) return;
    var dt = Math.min(clock.getDelta(), 0.05);
    update(dt, clock.elapsedTime);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf && running && visible && !reduce) { clock.getDelta(); raf = requestAnimationFrame(frame); } }

  if (reduce) { update(0.016, 3); renderer.render(scene, camera); }
  else start();

  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; start(); }).observe(hero);
  document.addEventListener('visibilitychange', function () { running = !document.hidden; start(); });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); hero.classList.add('nowebgl'); running = false; });
  window.__stageReady = true;
})();
