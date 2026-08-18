/* ═══════════════════════════════════════════════════════════
   HunterLoveCode · Portfolio — dashboard interactions
   ═══════════════════════════════════════════════════════════ */
'use strict';

/* ── Nav: scrolled state + mobile menu ────────────────────── */
const nav = document.getElementById('nav');
const navBurger = document.getElementById('navBurger');
const navLinks = document.getElementById('navLinks');

function onScroll() {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

navBurger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navBurger.classList.toggle('open', open);
  navBurger.setAttribute('aria-expanded', String(open));
});

// Close the mobile menu when a link is tapped.
navLinks.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    navLinks.classList.remove('open');
    navBurger.classList.remove('open');
    navBurger.setAttribute('aria-expanded', 'false');
  }
});

// Smooth-scroll to a section on nav click and flash-glow the target panel.
navLinks.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();

    const navH = nav.offsetHeight || 56;
    const top = target.getBoundingClientRect().top + window.scrollY - navH - 12;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });

    const focusEl = target.classList.contains('sidebar')
      ? target.querySelector('.sidebar-card')
      : target;
    focusEl.classList.remove('panel-focus');
    void focusEl.offsetWidth; // restart the animation
    focusEl.classList.add('panel-focus');
    setTimeout(() => focusEl.classList.remove('panel-focus'), 2200);
  });
});

/* ── Skill filter buttons ─────────────────────────────────── */
const filters = document.querySelectorAll('.filter');
const skills = document.querySelectorAll('.skill');

filters.forEach((btn) => {
  btn.addEventListener('click', () => {
    filters.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.filter;
    skills.forEach((skill) => {
      const show = cat === 'all' || skill.dataset.cat === cat;
      skill.classList.toggle('hidden', !show);
    });
  });
});

/* ── Scroll reveal + skill bars + rings ───────────────────── */
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;

    if (el.classList.contains('reveal')) {
      el.classList.add('visible');
    }

    // Animate bars that live inside the revealed element.
    el.querySelectorAll('.bar-fill').forEach((bar) => bar.classList.add('animated'));

    // Animate skill rings.
    el.querySelectorAll('.skill-ring').forEach((ring) => {
      const p = parseFloat(ring.style.getPropertyValue('--p')) || 0;
      ring.style.setProperty('--dash', String((p / 100) * 175.929));
      ring.classList.add('animated');
    });

    io.unobserve(el);
  });
}, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .bar').forEach((el) => io.observe(el));

// Pre-compute --dash on all rings so CSS transition works immediately.
document.querySelectorAll('.skill-ring').forEach((ring) => {
  const p = parseFloat(ring.style.getPropertyValue('--p')) || 0;
  ring.style.setProperty('--dash', String((p / 100) * 175.929));
});

// Stagger reveal delays for grid children.
document.querySelectorAll('.skills-row, .info-row, .projects-grid').forEach((grid) => {
  Array.from(grid.children).forEach((child, i) => {
    child.style.setProperty('--d', `${Math.min(i * 0.07, 0.4)}s`);
  });
});

/* ── 3D yellow particle background (three.js) ─────────────── */
const canvas = document.getElementById('bg3d');

function initScene() {
  if (typeof THREE === 'undefined') {
    canvas.style.display = 'none';
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x1a1209, 0.018);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  // Warm yellow lights.
  scene.add(new THREE.AmbientLight(0xffe2b0, 0.5));
  const key = new THREE.PointLight(0xffb03c, 1.3, 30);
  key.position.set(6, 4, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff8c42, 0.6);
  rim.position.set(-5, -3, 4);
  scene.add(rim);

  // Particle field — warm golden dust floating around the scene.
  function makeParticles(count, size, color, spread) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = spread * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.95, depthWrite: false });
    return new THREE.Points(geo, mat);
  }

  const dustNear = makeParticles(1100, 0.06, 0xffd700, 14);
  const dustFar = makeParticles(600, 0.1, 0xffeb3b, 20);
  scene.add(dustNear);
  scene.add(dustFar);

  // Mouse parallax targets.
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };

  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) animate();
  });

  function animate() {
    if (!running) return;

    // Smoothly follow the pointer.
    current.x += (target.x - current.x) * 0.045;
    current.y += (target.y - current.y) * 0.045;

    camera.position.x += (current.x * 1.4 - camera.position.x) * 0.05;
    camera.position.y += (-current.y * 1.0 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    dustNear.rotation.y += 0.00028;
    dustFar.rotation.y -= 0.0002;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}

initScene();

/* ── Floating particles on top of panels ─────────────── */
(function initTopParticles() {
  const container = document.getElementById('topParticles');
  if (!container) return;
  const count = 18;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'top-particle';
    const size = 2 + Math.random() * 3;
    const x = 10 + Math.random() * 80;
    const y = 5 + Math.random() * 85;
    const dur = 6 + Math.random() * 8;
    const delay = Math.random() * dur;
    const peak = 0.4 + Math.random() * 0.4;
    const dx = -40 + Math.random() * 80;
    const dy = -80 + Math.random() * 40;
    const dx2 = -30 + Math.random() * 60;
    const dy2 = -100 + Math.random() * 60;
    p.style.cssText = `left:${x}%;top:${y}%;--size:${size}px;--dur:${dur}s;--delay:${delay}s;--peak:${peak};--dx:${dx}px;--dy:${dy}px;--dx2:${dx2}px;--dy2:${dy2}px;`;
    container.appendChild(p);
  }
})();

/* ── Mini yellow cursor dot ─────────────────────────────── */
(function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot = document.createElement('div');
  dot.style.cssText = 'position:fixed;top:0;left:0;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle,rgba(255,208,138,1),rgba(245,166,35,.7) 60%,transparent 100%);pointer-events:none;z-index:9999;transform:translate(-50%,-50%);box-shadow:0 0 10px rgba(245,166,35,.7),0 0 20px rgba(245,166,35,.3);transition:width .2s ease,height .2s ease,box-shadow .2s ease;';
  document.body.appendChild(dot);

  // No smoothing — the dot follows the pointer instantly.
  window.addEventListener('pointermove', (e) => {
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
  }, { passive: true });

  document.addEventListener('mouseover', (e) => {
    const on = !!e.target.closest('a, button, .project-card, .social-icon, .skill, .filter, .reach-row');
    if (on) {
      dot.style.width = '20px';
      dot.style.height = '20px';
      dot.style.boxShadow = '0 0 16px rgba(255,208,138,1),0 0 30px rgba(245,166,35,.4)';
    } else {
      dot.style.width = '12px';
      dot.style.height = '12px';
      dot.style.boxShadow = '0 0 10px rgba(245,166,35,.7),0 0 20px rgba(245,166,35,.3)';
    }
  });

  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; });
})();