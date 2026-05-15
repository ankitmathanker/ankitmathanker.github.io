/*!
 * background.js — Metal–Electrolyte Interface Background
 * Animated Pt(111)/H₂O canvas background for ankitmathanker.github.io
 *
 * ─── QUICK START ────────────────────────────────────────────────────────────
 *
 *  1. In index.html, add this canvas as the FIRST child of <body>:
 *
 *       <canvas id="bg-canvas" aria-hidden="true"
 *               style="position:fixed;top:0;left:0;width:100%;height:100%;
 *                      z-index:-1;pointer-events:none;"></canvas>
 *
 *  2. Add these two lines just before the closing </body> tag
 *     (AFTER any other scripts):
 *
 *       <script src="js/background.js"></script>
 *       <script>initBackground('bg-canvas');</script>
 *
 *  3. In main.js, delete the old particle-canvas block
 *     (look for the section that creates a <canvas> and calls requestAnimationFrame
 *      for the floating-particle background). Leave mobile nav, photo toggle, etc.
 *
 * ─── OPTIONS ────────────────────────────────────────────────────────────────
 *
 *  Pass an optional object as the second argument:
 *
 *    initBackground('bg-canvas', {
 *      metal:         'Pt',   // 'Pt' | 'Au' | 'Ag' | 'Cu'
 *      numMolecules:  22,     // water molecules
 *      numCations:    9,      // K⁺ ions
 *      numAnions:     7,      // Cl⁻ ions
 *      repulseRadius: 90,     // mouse-repulsion radius (px)
 *      repulseForce:  0.65,   // mouse-repulsion strength
 *      showLabels:    true,   // hover atom-type labels
 *      bgColor:       '#0d1117',
 *    });
 *
 * ─── METAL PRESETS ──────────────────────────────────────────────────────────
 *
 *  'Pt'  silver-blue  (default)
 *  'Au'  gold
 *  'Ag'  silver-white
 *  'Cu'  copper-orange
 *
 * ─── WHAT'S SIMULATED ────────────────────────────────────────────────────────
 *
 *  • FCC (111) metal surface — three hexagonally close-packed layers
 *  • Water molecules — correct 104.5° H-O-H geometry, Brownian motion,
 *    surface adsorption/desorption with O-down orientation
 *  • H-bond network — dashed lines between nearby water molecules
 *  • K⁺ / Cl⁻ ions — EDL physics: cations drift toward electrode,
 *    anions drift away; both have pulsing glow
 *  • Electric double layer — Stern + diffuse layer with labelled OHP
 *  • Interface glow — charge accumulation at the metal surface
 *  • Vignette — edge darkening to keep focus on page content
 *
 * ─── INTERACTIVITY ───────────────────────────────────────────────────────────
 *
 *  • Mouse/touch repels nearby molecules and ions
 *  • Click creates a shockwave that scatters surrounding particles
 *  • Hover any atom (O, H, K⁺, Cl⁻, Pt/Au/Ag/Cu) to see its label
 */

(function (global) {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════════════
   *  METAL PRESETS
   * ═══════════════════════════════════════════════════════════════════════════ */
  const METAL_COLORS = {
    Pt: [168, 178, 205],
    Au: [210, 175,  90],
    Ag: [192, 192, 200],
    Cu: [185, 110,  70],
  };

  /* ═══════════════════════════════════════════════════════════════════════════
   *  MAIN INIT
   * ═══════════════════════════════════════════════════════════════════════════ */
  global.initBackground = function initBackground(canvasId, userOpts) {
    const cv = document.getElementById(canvasId);
    if (!cv) { console.warn('initBackground: canvas #' + canvasId + ' not found'); return; }
    const cx = cv.getContext('2d');

    /* ── Config ────────────────────────────────────────────────────────────── */
    const O = Object.assign({
      metal:         'Pt',
      numMolecules:  22,
      numCations:    9,
      numAnions:     7,
      repulseRadius: 90,
      repulseForce:  0.65,
      showLabels:    true,
      bgColor:       '#0d1117',
    }, userOpts || {});

    /* ── Canvas dimensions ─────────────────────────────────────────────────── */
    let W, H;
    function resize() {
      W = cv.width  = window.innerWidth;
      H = cv.height = window.innerHeight;
    }

    /* ── Surface interface Y (metal top edge) ─────────────────────────────── */
    const SURF_RATIO    = 0.70;   // surface sits at 70% down
    const LATTICE_R     = 8.5;    // atom radius
    const LATTICE_HSP   = 19.5;   // horizontal spacing
    const LATTICE_VSP   = 18.5;   // vertical layer spacing
    const HOH_HALF      = (104.5 * Math.PI / 180) / 2;
    const BOND_LEN      = 13;

    function sy()  { return Math.round(H * SURF_RATIO); }
    function mc()  { return METAL_COLORS[O.metal] || METAL_COLORS.Pt; }

    /* ── Shared state ─────────────────────────────────────────────────────── */
    const mouse      = { x: -9999, y: -9999 };
    const shockwaves = [];       // click ripples
    let   mols       = [];
    let   ions       = [];
    let   hovered    = null;     // { x, y, label, color }

    /* ══════════════════════════════════════════════════════════════════════════
     *  HELPERS
     * ══════════════════════════════════════════════════════════════════════════ */

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

    /** Apply mouse/touch repulsion to a velocity pair. */
    function repel(px, py, vx, vy) {
      const dx = px - mouse.x, dy = py - mouse.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < O.repulseRadius && d > 0.5) {
        const f = (1 - d / O.repulseRadius) * O.repulseForce;
        vx += (dx / d) * f;
        vy += (dy / d) * f;
      }
      return [vx, vy];
    }

    /** Apply click shockwave impulse. */
    function shockRepel(px, py, vx, vy) {
      for (const sw of shockwaves) {
        const dx = px - sw.x, dy = py - sw.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        const maxR = sw.maxR;
        const dr   = Math.abs(d - sw.r);
        if (dr < 30 && d > 0.5) {
          const f = (1 - dr / 30) * sw.strength * (1 - sw.r / maxR);
          vx += (dx / d) * f;
          vy += (dy / d) * f;
        }
      }
      return [vx, vy];
    }

    /** Draw a rounded rect path (safe cross-browser). */
    function rrect(x, y, w, h, r) {
      cx.beginPath();
      cx.moveTo(x + r, y);
      cx.lineTo(x + w - r, y);
      cx.arcTo(x + w, y,     x + w, y + r,     r);
      cx.lineTo(x + w, y + h - r);
      cx.arcTo(x + w, y + h, x + w - r, y + h, r);
      cx.lineTo(x + r, y + h);
      cx.arcTo(x,     y + h, x,     y + h - r, r);
      cx.lineTo(x,     y + r);
      cx.arcTo(x,     y,     x + r, y,          r);
      cx.closePath();
    }

    /** Compute O and H positions for a water molecule object. */
    function atomsOf(m) {
      const bx1 = m.x + Math.cos(m.a - HOH_HALF) * BOND_LEN;
      const by1 = m.y + Math.sin(m.a - HOH_HALF) * BOND_LEN;
      const bx2 = m.x + Math.cos(m.a + HOH_HALF) * BOND_LEN;
      const by2 = m.y + Math.sin(m.a + HOH_HALF) * BOND_LEN;
      return {
        o:  { x: m.x, y: m.y,  r: 5.5, label: 'O' },
        h1: { x: bx1, y: by1,  r: 3.5, label: 'H' },
        h2: { x: bx2, y: by2,  r: 3.5, label: 'H' },
      };
    }

    /* ══════════════════════════════════════════════════════════════════════════
     *  PARTICLES — WATER MOLECULES
     * ══════════════════════════════════════════════════════════════════════════ */

    function newMol() {
      const surface = sy();
      return {
        x:        Math.random() * W,
        y:        20 + Math.random() * (surface - 60),
        vx:       (Math.random() - 0.5) * 0.46,
        vy:       (Math.random() - 0.5) * 0.46,
        a:        Math.random() * Math.PI * 2,  // dipole orientation
        da:       (Math.random() - 0.5) * 0.013, // rotation speed
        adsorbed: false,
        adsT:     0,
        al:       0.55 + Math.random() * 0.35,
      };
    }

    function updateMol(m) {
      const surface = sy();

      /* Adsorbed: stay at surface, slow rotation, then desorb */
      if (m.adsorbed) {
        m.adsT--;
        m.a += m.da * 0.15;
        if (m.adsT <= 0) {
          m.adsorbed = false;
          m.vy = -(0.55 + Math.random() * 0.5);
        }
        return;
      }

      /* Brownian motion */
      m.vx += (Math.random() - 0.5) * 0.08;
      m.vy += (Math.random() - 0.5) * 0.08;

      /* Mouse + shockwave repulsion */
      let [nvx, nvy] = repel(m.x, m.y, m.vx, m.vy);
      [nvx, nvy] = shockRepel(m.x, m.y, nvx, nvy);
      m.vx = nvx; m.vy = nvy;

      /* Speed cap */
      const sp = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
      if (sp > 1.6) { m.vx *= 1.6 / sp; m.vy *= 1.6 / sp; }

      m.x += m.vx;
      m.y += m.vy;
      m.a += m.da;

      /* Horizontal wrap */
      if (m.x < -20)    m.x += W + 40;
      if (m.x > W + 20) m.x -= W + 40;

      /* Top wall */
      if (m.y < 14) { m.vy = Math.abs(m.vy); m.y = 14; }

      /* Surface interaction */
      if (m.y > surface - 19) {
        if (Math.random() < 0.042) {
          /* Adsorb with oxygen pointing toward surface */
          m.adsorbed = true;
          m.adsT     = 80 + Math.floor(Math.random() * 145);
          m.y        = surface - 19;
          m.vx       = 0;
          m.vy       = 0;
          m.a        = -Math.PI / 2 + (Math.random() - 0.5) * 0.45;
        } else {
          m.vy = -Math.abs(m.vy);
          m.y  = surface - 19;
        }
      }
    }

    function drawMol(m) {
      const at = atomsOf(m);
      const al = m.al;

      /* O–H bonds */
      cx.lineWidth   = 1.5;
      cx.strokeStyle = `rgba(140,195,235,${(al * 0.50).toFixed(3)})`;
      cx.beginPath();
      cx.moveTo(at.o.x, at.o.y); cx.lineTo(at.h1.x, at.h1.y);
      cx.moveTo(at.o.x, at.o.y); cx.lineTo(at.h2.x, at.h2.y);
      cx.stroke();

      /* Oxygen */
      cx.beginPath(); cx.arc(at.o.x, at.o.y, at.o.r, 0, Math.PI * 2);
      cx.fillStyle = `rgba(205,65,55,${(al * 0.84).toFixed(3)})`; cx.fill();

      /* Hydrogens */
      cx.fillStyle = `rgba(190,220,255,${(al * 0.78).toFixed(3)})`;
      cx.beginPath(); cx.arc(at.h1.x, at.h1.y, at.h1.r, 0, Math.PI * 2); cx.fill();
      cx.beginPath(); cx.arc(at.h2.x, at.h2.y, at.h2.r, 0, Math.PI * 2); cx.fill();
    }

    /* ══════════════════════════════════════════════════════════════════════════
     *  PARTICLES — IONS
     * ══════════════════════════════════════════════════════════════════════════ */

    function newIon(charge) {
      const surface = sy();
      return {
        ch:    charge,
        x:     Math.random() * W,
        y:     20 + Math.random() * (surface - 70),
        vx:    (Math.random() - 0.5) * 0.32,
        vy:    (Math.random() - 0.5) * 0.32,
        p:     Math.random() * Math.PI * 2,   // phase for pulsing
        label: charge > 0 ? 'K\u207a' : 'Cl\u207b',
      };
    }

    function updateIon(ion) {
      const surface = sy();

      /* Brownian + EDL drift */
      ion.vx += (Math.random() - 0.5) * 0.055;
      ion.vy += (Math.random() - 0.5) * 0.055;
      ion.vy += ion.ch * 0.0045;          // cations →surface, anions ←surface

      /* Mouse + shockwave repulsion */
      let [nvx, nvy] = repel(ion.x, ion.y, ion.vx, ion.vy);
      [nvx, nvy] = shockRepel(ion.x, ion.y, nvx, nvy);
      ion.vx = nvx; ion.vy = nvy;

      /* Speed cap */
      const sp = Math.sqrt(ion.vx * ion.vx + ion.vy * ion.vy);
      if (sp > 1.4) { ion.vx *= 1.4 / sp; ion.vy *= 1.4 / sp; }

      ion.x  += ion.vx;
      ion.y  += ion.vy;
      ion.p  += 0.036;

      if (ion.x < -14)   ion.x += W + 28;
      if (ion.x > W + 14) ion.x -= W + 28;
      if (ion.y < 12)    { ion.vy =  Math.abs(ion.vy); }
      if (ion.y > surface - 26) { ion.vy = -Math.abs(ion.vy); ion.y = surface - 26; }
    }

    function drawIon(ion) {
      const b = 0.55 + 0.2 * Math.sin(ion.p);
      if (ion.ch > 0) {
        /* Cation — cyan */
        cx.beginPath(); cx.arc(ion.x, ion.y, 5.5, 0, Math.PI * 2);
        cx.fillStyle   = `rgba(60,175,220,${(b * 0.70).toFixed(3)})`; cx.fill();
        cx.strokeStyle = `rgba(110,220,255,${(b * 0.88).toFixed(3)})`; cx.lineWidth = 1; cx.stroke();
        cx.strokeStyle = `rgba(180,235,255,${(b * 0.90).toFixed(3)})`; cx.lineWidth = 1.3;
        cx.beginPath();
        cx.moveTo(ion.x - 3, ion.y); cx.lineTo(ion.x + 3, ion.y);
        cx.moveTo(ion.x, ion.y - 3); cx.lineTo(ion.x, ion.y + 3);
        cx.stroke();
      } else {
        /* Anion — orange */
        cx.beginPath(); cx.arc(ion.x, ion.y, 5.5, 0, Math.PI * 2);
        cx.fillStyle   = `rgba(230,110,55,${(b * 0.70).toFixed(3)})`; cx.fill();
        cx.strokeStyle = `rgba(255,160,80,${(b * 0.88).toFixed(3)})`; cx.lineWidth = 1; cx.stroke();
        cx.strokeStyle = `rgba(255,210,180,${(b * 0.90).toFixed(3)})`; cx.lineWidth = 1.3;
        cx.beginPath();
        cx.moveTo(ion.x - 3, ion.y); cx.lineTo(ion.x + 3, ion.y);
        cx.stroke();
      }
    }

    /* ══════════════════════════════════════════════════════════════════════════
     *  SHOCKWAVE RIPPLES (click effect)
     * ══════════════════════════════════════════════════════════════════════════ */

    function addShockwave(x, y) {
      shockwaves.push({ x, y, r: 0, maxR: 160, strength: 1.8, alpha: 1.0 });
    }

    function updateShockwaves() {
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.r     += 4.5;
        sw.alpha  = 1 - sw.r / sw.maxR;
        if (sw.r >= sw.maxR) shockwaves.splice(i, 1);
      }
    }

    function drawShockwaves() {
      for (const sw of shockwaves) {
        if (sw.alpha <= 0) continue;
        cx.beginPath();
        cx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        cx.strokeStyle = `rgba(0,200,255,${(sw.alpha * 0.35).toFixed(3)})`;
        cx.lineWidth   = 1.5;
        cx.stroke();
        /* Inner ring */
        if (sw.r > 12) {
          cx.beginPath();
          cx.arc(sw.x, sw.y, sw.r * 0.55, 0, Math.PI * 2);
          cx.strokeStyle = `rgba(0,200,255,${(sw.alpha * 0.18).toFixed(3)})`;
          cx.lineWidth   = 0.8;
          cx.stroke();
        }
      }
    }

    /* ══════════════════════════════════════════════════════════════════════════
     *  H-BOND NETWORK
     * ══════════════════════════════════════════════════════════════════════════ */

    function drawHbonds() {
      const THRESH = 48;
      cx.setLineDash([3, 4]);
      for (let i = 0; i < mols.length; i++) {
        for (let j = i + 1; j < mols.length; j++) {
          const dx = mols[i].x - mols[j].x;
          const dy = mols[i].y - mols[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < THRESH && d > 17) {
            const al = ((1 - d / THRESH) * 0.20).toFixed(3);
            cx.strokeStyle = `rgba(80,160,210,${al})`;
            cx.lineWidth   = 0.8;
            cx.beginPath();
            cx.moveTo(mols[i].x, mols[i].y);
            cx.lineTo(mols[j].x, mols[j].y);
            cx.stroke();
          }
        }
      }
      cx.setLineDash([]);
    }

    /* ══════════════════════════════════════════════════════════════════════════
     *  ELECTRIC DOUBLE LAYER
     * ══════════════════════════════════════════════════════════════════════════ */

    function drawEDL() {
      const surface = sy(), edlH = 74;
      const g = cx.createLinearGradient(0, surface - edlH, 0, surface);
      g.addColorStop(0,    'rgba(0,140,220,0)');
      g.addColorStop(0.58, 'rgba(0,155,235,0.048)');
      g.addColorStop(1,    'rgba(0,200,255,0.11)');
      cx.fillStyle = g;
      cx.fillRect(0, surface - edlH, W, edlH);

      /* Outer Helmholtz Plane */
      cx.strokeStyle = 'rgba(0,190,255,0.20)';
      cx.lineWidth   = 0.5;
      cx.setLineDash([8, 7]);
      cx.beginPath();
      cx.moveTo(0, surface - edlH + 14); cx.lineTo(W, surface - edlH + 14);
      cx.stroke();
      cx.setLineDash([]);

      /* Layer labels */
      cx.font      = '9px monospace';
      cx.fillStyle = 'rgba(0,190,255,0.30)';
      cx.fillText('DIFFUSE LAYER', 14, surface - edlH + 11);
      cx.fillText('STERN LAYER',   14, surface - 10);
    }

    /* ══════════════════════════════════════════════════════════════════════════
     *  METAL LATTICE — FCC (111)
     * ══════════════════════════════════════════════════════════════════════════ */

    function drawLattice() {
      const surface = sy();
      const r   = LATTICE_R;
      const hsp = LATTICE_HSP;
      const vsp = LATTICE_VSP;
      const [rcBase, gcBase, bcBase] = mc();

      /* Bulk metal fill below top layer */
      cx.fillStyle = 'rgba(15,19,30,0.97)';
      cx.fillRect(0, surface + r - 2, W, H - surface - r + 2);

      /* Three ABC-stacked hex layers: top → bottom */
      const LAYERS = [
        { dy: 0,       off: 0,      al: 0.87, dr:  0  },   // top visible
        { dy: vsp,     off: hsp/2,  al: 0.63, dr: -14 },   // mid
        { dy: vsp * 2, off: 0,      al: 0.38, dr: -26 },   // deep
      ];

      for (const layer of LAYERS) {
        const ny  = surface + r + layer.dy;
        const cnt = Math.ceil(W / hsp) + 4;
        const lrc = clamp(rcBase + layer.dr, 0, 255);
        const lgc = clamp(gcBase + layer.dr, 0, 255);
        const lbc = clamp(bcBase + layer.dr, 0, 255);

        for (let i = -2; i < cnt; i++) {
          const ax = i * hsp + layer.off;

          /* Sphere shading: highlight top-left */
          const g = cx.createRadialGradient(ax - r * 0.28, ny - r * 0.30, 0.5, ax, ny, r);
          g.addColorStop(0,    `rgba(${clamp(lrc+48,0,255)},${clamp(lgc+48,0,255)},${clamp(lbc+48,0,255)},${layer.al})`);
          g.addColorStop(0.55, `rgba(${lrc},${lgc},${lbc},${layer.al})`);
          g.addColorStop(1,    `rgba(${clamp(lrc-40,0,255)},${clamp(lgc-40,0,255)},${clamp(lbc-40,0,255)},${(layer.al * 0.48).toFixed(3)})`);

          cx.beginPath(); cx.arc(ax, ny, r, 0, Math.PI * 2);
          cx.fillStyle = g; cx.fill();
        }
      }

      /* Interface charge-accumulation glow */
      const ig = cx.createLinearGradient(0, surface - 7, 0, surface + r * 1.7);
      ig.addColorStop(0,    'rgba(0,180,255,0)');
      ig.addColorStop(0.42, 'rgba(0,180,255,0.078)');
      ig.addColorStop(1,    'rgba(0,180,255,0)');
      cx.fillStyle = ig;
      cx.fillRect(0, surface - 7, W, r * 2 + 7);
    }

    /* ══════════════════════════════════════════════════════════════════════════
     *  VIGNETTE
     * ══════════════════════════════════════════════════════════════════════════ */

    function drawVignette() {
      const g = cx.createRadialGradient(W / 2, H / 2, H * 0.22, W / 2, H / 2, H * 0.88);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.40)');
      cx.fillStyle = g;
      cx.fillRect(0, 0, W, H);
    }

    /* ══════════════════════════════════════════════════════════════════════════
     *  HOVER DETECTION & LABEL
     * ══════════════════════════════════════════════════════════════════════════ */

    function detectHover() {
      hovered = null;
      if (!O.showLabels) return;

      const surface = sy();

      /* 1. Ions */
      for (const ion of ions) {
        const d = Math.sqrt((ion.x - mouse.x) ** 2 + (ion.y - mouse.y) ** 2);
        if (d < 13) {
          hovered = {
            x: ion.x, y: ion.y,
            label: ion.label,
            color: ion.ch > 0 ? 'rgba(110,220,255,0.96)' : 'rgba(255,162,82,0.96)',
          };
          cv.style.cursor = 'crosshair';
          return;
        }
      }

      /* 2. Water atoms */
      for (const mol of mols) {
        const { o, h1, h2 } = atomsOf(mol);
        for (const atom of [o, h1, h2]) {
          const d = Math.sqrt((atom.x - mouse.x) ** 2 + (atom.y - mouse.y) ** 2);
          if (d < atom.r + 7) {
            hovered = {
              x: atom.x, y: atom.y,
              label: atom.label,
              color: atom.label === 'O' ? 'rgba(235,95,80,0.96)' : 'rgba(190,220,255,0.96)',
            };
            cv.style.cursor = 'crosshair';
            return;
          }
        }
      }

      /* 3. Metal surface atoms */
      const metalName = O.metal || 'Pt';
      const r   = LATTICE_R, hsp = LATTICE_HSP, vsp = LATTICE_VSP;
      const ptLayers = [
        { dy: 0,     off: 0     },
        { dy: vsp,   off: hsp/2 },
        { dy: vsp*2, off: 0     },
      ];
      for (const layer of ptLayers) {
        const ny  = surface + r + layer.dy;
        const cnt = Math.ceil(W / hsp) + 4;
        for (let i = -2; i < cnt; i++) {
          const ax = i * hsp + layer.off;
          const d  = Math.sqrt((ax - mouse.x) ** 2 + (ny - mouse.y) ** 2);
          if (d < r + 5) {
            hovered = {
              x: ax, y: ny,
              label: metalName,
              color: 'rgba(185,195,225,0.96)',
            };
            cv.style.cursor = 'crosshair';
            return;
          }
        }
      }

      cv.style.cursor = 'default';
    }

    function drawHoverLabel() {
      if (!hovered) return;
      const { x, y, label, color } = hovered;

      cx.font = 'bold 11px monospace';
      const tw = cx.measureText(label).width;
      const px = 9, bh = 20, bw = tw + px * 2;
      let bx = x - bw / 2;
      let by = y - 35;

      /* Keep inside canvas bounds */
      bx = clamp(bx, 4, W - bw - 4);
      if (by < 6) by = y + 18;

      /* Background pill */
      cx.fillStyle = 'rgba(8,12,22,0.90)';
      rrect(bx, by, bw, bh, 4); cx.fill();
      cx.strokeStyle = color; cx.lineWidth = 0.8;
      rrect(bx, by, bw, bh, 4); cx.stroke();

      /* Label text */
      cx.fillStyle = color;
      cx.fillText(label, bx + px, by + bh - 6);

      /* Connector */
      cx.strokeStyle = color; cx.lineWidth = 0.6; cx.setLineDash([2, 3]);
      cx.beginPath(); cx.moveTo(x, by + bh); cx.lineTo(x, y - 8); cx.stroke();
      cx.setLineDash([]);

      /* Dot on atom */
      cx.beginPath(); cx.arc(x, y, 3.2, 0, Math.PI * 2);
      cx.fillStyle = color; cx.fill();
    }

    /* ══════════════════════════════════════════════════════════════════════════
     *  INIT PARTICLES
     * ══════════════════════════════════════════════════════════════════════════ */

    function initParticles() {
      mols = Array.from({ length: O.numMolecules }, newMol);
      ions = [
        ...Array.from({ length: O.numCations }, () => newIon( 1)),
        ...Array.from({ length: O.numAnions  }, () => newIon(-1)),
      ];
    }

    /* ══════════════════════════════════════════════════════════════════════════
     *  RENDER LOOP
     * ══════════════════════════════════════════════════════════════════════════ */

    function tick() {
      requestAnimationFrame(tick);

      /* Background */
      cx.fillStyle = O.bgColor;
      cx.fillRect(0, 0, W, H);

      /* EDL glow */
      drawEDL();

      /* H-bond network */
      drawHbonds();

      /* Particles */
      for (const ion of ions)  { updateIon(ion);  drawIon(ion);  }
      for (const mol of mols)  { updateMol(mol);  drawMol(mol);  }

      /* Shockwaves */
      updateShockwaves();
      drawShockwaves();

      /* Metal lattice (drawn on top so it stays solid) */
      drawLattice();

      /* Vignette */
      drawVignette();

      /* Hover */
      detectHover();
      drawHoverLabel();
    }

    /* ══════════════════════════════════════════════════════════════════════════
     *  EVENTS
     * ══════════════════════════════════════════════════════════════════════════ */

    /* Mouse */
    document.addEventListener('mousemove', e => {
      const r  = cv.getBoundingClientRect();
      mouse.x  = e.clientX - r.left;
      mouse.y  = e.clientY - r.top;
    });
    document.addEventListener('mouseleave', () => {
      mouse.x = -9999; mouse.y = -9999;
      cv.style.cursor = 'default';
    });

    /* Click shockwave */
    document.addEventListener('click', e => {
      const r = cv.getBoundingClientRect();
      addShockwave(e.clientX - r.left, e.clientY - r.top);
    });

    /* Touch */
    document.addEventListener('touchmove', e => {
      if (e.touches.length > 0) {
        const r = cv.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - r.left;
        mouse.y = e.touches[0].clientY - r.top;
      }
    }, { passive: true });
    document.addEventListener('touchend', e => {
      if (e.changedTouches.length > 0) {
        const r  = cv.getBoundingClientRect();
        const tx = e.changedTouches[0].clientX - r.left;
        const ty = e.changedTouches[0].clientY - r.top;
        addShockwave(tx, ty);
      }
      mouse.x = -9999; mouse.y = -9999;
    });

    /* Resize — debounced */
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); }, 120);
    });

    /* ══════════════════════════════════════════════════════════════════════════
     *  BOOT
     * ══════════════════════════════════════════════════════════════════════════ */

    resize();
    initParticles();
    tick();
  };

})(window);
