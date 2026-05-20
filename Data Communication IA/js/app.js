/* global THREE, gsap, ScrollTrigger, Lenis */

const app = {
  scrollVelocity: 0,
  mouse: { x: 0, y: 0 },
  currentSection: "home"
};

const themeToggle = document.querySelector(".theme-toggle");
const themeToggleText = document.querySelector(".theme-toggle__text");
const savedTheme = localStorage.getItem("dataCommsTheme");

function setTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-mode", isLight);
  themeToggle.setAttribute("aria-pressed", String(isLight));
  themeToggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  themeToggleText.textContent = isLight ? "Light" : "Dark";
  localStorage.setItem("dataCommsTheme", theme);
}

setTheme(savedTheme === "light" ? "light" : "dark");

themeToggle.addEventListener("click", () => {
  setTheme(document.body.classList.contains("light-mode") ? "dark" : "light");
});

gsap.registerPlugin(ScrollTrigger);

// Smooth scrolling keeps the site feeling like a guided cinematic sequence.
const lenis = new Lenis({
  lerp: 0.075,
  wheelMultiplier: 1.05,
  smoothWheel: true
});

lenis.on("scroll", ({ velocity, scroll, limit }) => {
  app.scrollVelocity = velocity;
  const progress = limit ? scroll / limit : 0;
  document.querySelector(".scroll-progress").style.width = `${progress * 100}%`;
  document.querySelector(".site-header").classList.toggle("is-compact", scroll > 80);
  ScrollTrigger.update();
});

gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Three.js scene: starfield, digital Earth, moving satellite, and signal beams.
const canvas = document.querySelector("#space-canvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 120);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);

camera.position.set(0, 0.35, 9);

const ambient = new THREE.AmbientLight(0xffffff, 0.52);
const keyLight = new THREE.DirectionalLight(0x66ccff, 2.6);
keyLight.position.set(4, 3, 6);
const rimLight = new THREE.PointLight(0x00a6ff, 2.4, 18);
rimLight.position.set(-4, -1, 5);
scene.add(ambient, keyLight, rimLight);

function createEarthTexture() {
  const earthCanvas = document.createElement("canvas");
  earthCanvas.width = 1024;
  earthCanvas.height = 512;
  const ctx = earthCanvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, earthCanvas.width, earthCanvas.height);
  gradient.addColorStop(0, "#00152a");
  gradient.addColorStop(0.5, "#0077ff");
  gradient.addColorStop(1, "#00101f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, earthCanvas.width, earthCanvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  for (let i = 0; i < 54; i += 1) {
    const x = Math.random() * earthCanvas.width;
    const y = Math.random() * earthCanvas.height;
    const w = 42 + Math.random() * 120;
    const h = 8 + Math.random() * 28;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  for (let x = 0; x < earthCanvas.width; x += 74) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, earthCanvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < earthCanvas.height; y += 58) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(earthCanvas.width, y);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(earthCanvas);
}

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(1.85, 72, 72),
  new THREE.MeshStandardMaterial({
    map: createEarthTexture(),
    transparent: true,
    opacity: 0.88,
    metalness: 0.12,
    roughness: 0.38,
    emissive: new THREE.Color(0x003866),
    emissiveIntensity: 0.28
  })
);
earth.position.set(3.25, 0.85, -1.2);
scene.add(earth);

const earthGlow = new THREE.Mesh(
  new THREE.SphereGeometry(1.95, 72, 72),
  new THREE.MeshBasicMaterial({ color: 0x00a6ff, transparent: true, opacity: 0.09, side: THREE.BackSide })
);
earthGlow.position.copy(earth.position);
scene.add(earthGlow);

function makeSatellite() {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xe8f7ff, metalness: 0.82, roughness: 0.18 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x07111d, metalness: 0.55, roughness: 0.2 });
  const blueMaterial = new THREE.MeshStandardMaterial({ color: 0x00a6ff, emissive: 0x0066ff, emissiveIntensity: 0.35 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.42), bodyMaterial);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.38, 24), darkMaterial);
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.39;
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.7, 10), blueMaterial);
  antenna.rotation.z = Math.PI / 2;
  antenna.position.x = -0.54;

  const panelGeometry = new THREE.BoxGeometry(1.15, 0.03, 0.58);
  const panelLeft = new THREE.Mesh(panelGeometry, blueMaterial);
  const panelRight = new THREE.Mesh(panelGeometry, blueMaterial);
  panelLeft.position.x = -0.98;
  panelRight.position.x = 0.98;

  [body, lens, antenna, panelLeft, panelRight].forEach((mesh) => {
    mesh.castShadow = true;
    group.add(mesh);
  });

  const signalMaterial = new THREE.MeshBasicMaterial({ color: 0x00a6ff, transparent: true, opacity: 0.24, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5 + i * 0.34, 0.006, 8, 80), signalMaterial.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.z = 0.78 + i * 0.08;
    ring.userData.phase = i * 0.6;
    group.add(ring);
  }

  group.position.set(-3.2, 2.4, 1.7);
  group.rotation.set(0.25, -0.2, 0.1);
  return group;
}

const satellite = makeSatellite();
scene.add(satellite);

function makeStars() {
  const count = window.innerWidth < 700 ? 650 : 1200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 34;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
    positions[i * 3 + 2] = -Math.random() * 34;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.026, transparent: true, opacity: 0.72 });
  return new THREE.Points(geometry, material);
}

const stars = makeStars();
scene.add(stars);

ScrollTrigger.create({
  trigger: document.body,
  start: "top top",
  end: "bottom bottom",
  scrub: true,
  onUpdate: (self) => {
    const p = self.progress;
    satellite.position.y = 2.45 - p * 6.2;
    satellite.position.x = -3.2 + Math.sin(p * Math.PI * 2.4) * 1.1;
    satellite.position.z = 1.7 - p * 1.1;
    earth.position.y = 0.55 + Math.sin(p * Math.PI * 2) * 0.22;
    earth.position.x = window.innerWidth < 760 ? 2.4 : 3.8;
    earth.position.z = -2.35;
    earth.scale.setScalar(window.innerWidth < 760 ? 0.9 : 1.18);
    earthGlow.scale.copy(earth.scale);
    earth.material.opacity = 0.72;
    earthGlow.material.opacity = 0.095;
    earthGlow.position.copy(earth.position);
  }
});

// Hero intro uses scale, blur, and fast easing to suggest acceleration.
window.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".loader").classList.add("is-hidden");
  gsap.from(".hero__content", { opacity: 0, scale: 0.88, y: 60, duration: 0.75, ease: "power4.out" });
  gsap.from(".hero__hud", { opacity: 0, x: 90, duration: 0.65, delay: 0.2, ease: "power3.out" });
});
window.addEventListener("load", () => {
  document.querySelector(".loader").classList.add("is-hidden");
});
setTimeout(() => document.querySelector(".loader").classList.add("is-hidden"), 1200);

gsap.utils.toArray(".reveal").forEach((item) => {
  gsap.to(item, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.9,
    ease: "power3.out",
    scrollTrigger: {
      trigger: item,
      start: "top 82%",
      toggleActions: "play none none reverse"
    }
  });
});

gsap.utils.toArray("[data-speed]").forEach((layer) => {
  gsap.to(layer, {
    yPercent: () => (Number(layer.dataset.speed) - 1) * 38,
    ease: "none",
    scrollTrigger: {
      trigger: layer.closest("section"),
      start: "top bottom",
      end: "bottom top",
      scrub: true
    }
  });
});

gsap.to(".hero__content", {
  scale: 1.08,
  opacity: 0.12,
  filter: "blur(8px)",
  ease: "none",
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",
    end: "bottom top",
    scrub: true
  }
});

// Animated stats count up once they enter view.
document.querySelectorAll("[data-count]").forEach((counter) => {
  ScrollTrigger.create({
    trigger: counter,
    start: "top 85%",
    once: true,
    onEnter: () => {
      gsap.to(counter, {
        textContent: counter.dataset.count,
        duration: 1.4,
        snap: { textContent: 1 },
        ease: "power2.out"
      });
    }
  });
});

// Typewriter line loops through the core assignment themes.
const typingTarget = document.querySelector("#typing-text");
const phrases = ["Orbiting protocols.", "Encrypting trust.", "Accelerating signals.", "Mapping the OSI stack."];
let phraseIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
  const phrase = phrases[phraseIndex];
  typingTarget.textContent = phrase.slice(0, charIndex);
  if (!deleting && charIndex < phrase.length) {
    charIndex += 1;
    setTimeout(typeLoop, 48);
  } else if (!deleting) {
    deleting = true;
    setTimeout(typeLoop, 1000);
  } else if (charIndex > 0) {
    charIndex -= 1;
    setTimeout(typeLoop, 26);
  } else {
    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    setTimeout(typeLoop, 280);
  }
}
typeLoop();

// Mouse-reactive cursor and tilt cards give the interface a tactile feel.
const cursor = document.querySelector(".cursor");
window.addEventListener("pointermove", (event) => {
  app.mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
  app.mouse.y = (event.clientY / window.innerHeight - 0.5) * 2;
  gsap.to(cursor, { x: event.clientX, y: event.clientY, duration: 0.16, ease: "power2.out" });
});

document.querySelectorAll(".tilt-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 11;
    const rotateX = ((y / rect.height) - 0.5) * -11;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

// Responsive navigation with same-page smooth scrolling.
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    navLinks.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    lenis.scrollTo(target, { offset: -20, duration: 1.2 });
  });
});

document.querySelectorAll("main section[id]").forEach((section) => {
  ScrollTrigger.create({
    trigger: section,
    start: "top center",
    end: "bottom center",
    onToggle: (self) => {
      if (!self.isActive) return;
      app.currentSection = section.id;
      document.querySelectorAll(".nav-links a").forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${section.id}`);
      });
    }
  });
});

function animate(time) {
  const t = time * 0.001;
  const velocityTilt = THREE.MathUtils.clamp(app.scrollVelocity * 0.03, -0.5, 0.5);

  earth.rotation.y += 0.0028;
  stars.rotation.y += 0.00045;
  stars.position.y = Math.sin(t * 0.22) * 0.18;

  satellite.rotation.x += 0.006 + Math.abs(app.scrollVelocity) * 0.0004;
  satellite.rotation.y += 0.008;
  satellite.rotation.z = Math.sin(t * 1.2) * 0.18 + velocityTilt;
  satellite.position.x += Math.sin(t * 1.35) * 0.0018;

  satellite.children.forEach((child) => {
    if (child.userData.phase !== undefined) {
      child.scale.setScalar(1 + Math.sin(t * 2.8 + child.userData.phase) * 0.11);
      child.material.opacity = 0.15 + Math.abs(Math.sin(t * 2.8 + child.userData.phase)) * 0.22;
    }
  });

  camera.position.x += ((app.mouse.x * 0.35) - camera.position.x) * 0.025;
  camera.position.y += ((0.35 - app.mouse.y * 0.18) - camera.position.y) * 0.025;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  ScrollTrigger.refresh();
});
