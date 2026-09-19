/* ══ field ══
   A grainy, domain-warped gradient field, rendered on WebGL2. Two instances
   share this module with different palettes: a pale "dawn" wash behind the
   hero, and a deeper "dusk" wash behind the footer. Built from scratch with
   the classic (public-domain) 2D simplex noise by Stefan Gustavson / Ashima
   Arts — not a port of any particular site's shader. ── */
(function () {
  'use strict';

  const VERT = `#version 300 es
  in vec2 position;
  out vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

  const FRAG = `#version 300 es
  precision mediump float;

  uniform vec2 uRes;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uColorD;
  uniform vec2 uGlow;
  uniform float uGrain;

  in vec2 vUv;
  out vec4 fragColor;

  // classic 2D simplex noise — public domain (Ashima Arts / Stefan Gustavson)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  void main() {
    float asp = uRes.x / uRes.y;
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * asp, uv.y);
    float t = uTime * 0.05;

    // domain warp: one noise field nudges the sampling point of another
    vec2 warp = vec2(
      snoise(p * 1.5 + vec2(t, 0.0)),
      snoise(p * 1.5 + vec2(0.0, t))
    ) * 0.4;

    float n = snoise((p + warp) * 1.05 + vec2(t * 0.55, -t * 0.4));
    n += 0.5 * snoise((p + warp) * 2.2 - vec2(t * 0.3, t * 0.5));
    n = n * 0.5 + 0.5;

    // vertical bias keeps colour A at the top and D at the bottom, with the
    // warped noise doing the organic pooling in between
    float grad = clamp(uv.y * 0.62 + n * 0.55 - 0.12, 0.0, 1.0);

    vec3 col = mix(uColorA, uColorB, smoothstep(0.0, 0.42, grad));
    col = mix(col, uColorC, smoothstep(0.34, 0.72, grad));
    col = mix(col, uColorD, smoothstep(0.66, 1.0, grad));

    // one soft off-centre glow, standing in for a light source
    float glow = smoothstep(0.62, 0.0, distance(uv * vec2(asp, 1.0), uGlow * vec2(asp, 1.0)));
    col += glow * 0.16;

    // fine grain
    float g = fract(sin(dot(uv * uRes.xy, vec2(12.9898, 78.233))) * 43758.5453 + uTime * 3.0);
    col += (g - 0.5) * uGrain;

    // dissolve into the page at a rounded edge
    vec2 c = (vUv - 0.5) * uRes;
    float m2 = min(uRes.x, uRes.y);
    float rad = m2 * 0.14;
    float d = sdRoundBox(c, 0.5 * uRes, rad);
    float fade = m2 * 0.18;
    float vig = pow(smoothstep(0.0, -fade, d), 0.9);

    fragColor = vec4(col * vig, vig);
  }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('field shader:', gl.getShaderInfoLog(s));
    }
    return s;
  }

  function hexToRgb01(hex) {
    const v = parseInt(hex.replace('#', ''), 16);
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
  }

  function makeField(canvas, opts) {
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) {
      canvas.style.background = opts.fallback || 'linear-gradient(160deg,#eae6f6,#cfe0f2 45%,#f3d7dd 100%)';
      return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('field program:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const loc = name => gl.getUniformLocation(program, name);
    const u = {
      uRes: loc('uRes'), uTime: loc('uTime'),
      uColorA: loc('uColorA'), uColorB: loc('uColorB'), uColorC: loc('uColorC'), uColorD: loc('uColorD'),
      uGlow: loc('uGlow'), uGrain: loc('uGrain'),
    };
    const [ca, cb, cc, cd] = opts.colors.map(hexToRgb01);
    gl.uniform3f(u.uColorA, ...ca);
    gl.uniform3f(u.uColorB, ...cb);
    gl.uniform3f(u.uColorC, ...cc);
    gl.uniform3f(u.uColorD, ...cd);
    gl.uniform2f(u.uGlow, opts.glow[0], opts.glow[1]);
    gl.uniform1f(u.uGrain, opts.grain != null ? opts.grain : 0.03);

    const dpr = Math.min(devicePixelRatio || 1, 2);
    function size() {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width * dpr));
      const h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    }
    size();
    addEventListener('resize', size);

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isHero = canvas.id === 'field';
    let onScreen = true;
    new IntersectionObserver(es => {
      es.forEach(e => {
        const was = onScreen;
        onScreen = e.isIntersecting;
        if (onScreen && !was && !reduce) requestAnimationFrame(render);
      });
    }, { rootMargin: '120px' }).observe(canvas);

    const start = performance.now();
    function render(now) {
      const elapsed = reduce ? 6 : (now - start) / 1000;
      size();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, elapsed);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      if ((isHero || onScreen) && !document.hidden) gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reduce && (isHero || onScreen) && !document.hidden) requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
    addEventListener('visibilitychange', () => {
      if (!document.hidden && (isHero || onScreen) && !reduce) requestAnimationFrame(render);
    });
  }

  /* hero: bright white light easing into powder blue, then pooling into
     a lime-to-forest green underneath */
  makeField(document.getElementById('field'), {
    colors: ['#F5F9F7', '#C3DEEC', '#A6CC79', '#2E6B43'],
    glow: [0.68, 0.18],
    grain: 0.022,
    fallback: 'linear-gradient(160deg,#f5f9f7,#c3deec 35%,#a6cc79 70%,#2e6b43)',
  });

  /* footer: the same field toward dusk — indigo through violet to a low, warm horizon */
  makeField(document.getElementById('dusk'), {
    colors: ['#161B42', '#3B3178', '#8B5C82', '#F0AE79'],
    glow: [0.62, 0.86],
    grain: 0.035,
    fallback: 'linear-gradient(180deg,#161b42,#3b3178 40%,#8b5c82 72%,#f0ae79)',
  });
})();
