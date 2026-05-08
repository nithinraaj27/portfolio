import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- Three.js: Sophisticated Network Background ---
const canvas = document.querySelector('#three-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Network Nodes
const particlesCount = 80;
const positions = new Float32Array(particlesCount * 3);
const velocities = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 12;
  velocities[i] = (Math.random() - 0.5) * 0.01;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.04,
  color: '#3b82f6',
  transparent: true,
  opacity: 0.8
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Connection Lines (Plexus)
const linesMaterial = new THREE.LineBasicMaterial({
  color: '#3b82f6',
  transparent: true,
  opacity: 0.2
});

let linesMesh;

camera.position.z = 5;

// Mouse Interaction
let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) - 0.5;
  mouseY = (e.clientY / window.innerHeight) - 0.5;
});

// --- Theme Change Handling ---
window.addEventListener('theme-changed', (e) => {
  const isLight = e.detail.isLight;
  const color = isLight ? '#2563eb' : '#3b82f6';
  const opacity = isLight ? 0.4 : 0.2;
  
  particlesMaterial.color.set(color);
  linesMaterial.color.set(color);
  linesMaterial.opacity = opacity;
});

// Animation Loop
const clock = new THREE.Clock();

function updateNetwork() {
  const pos = particlesGeometry.attributes.position.array;
  
  for (let i = 0; i < particlesCount; i++) {
    const i3 = i * 3;
    pos[i3] += velocities[i3];
    pos[i3+1] += velocities[i3+1];
    pos[i3+2] += velocities[i3+2];

    // Boundary check
    if (Math.abs(pos[i3]) > 6) velocities[i3] *= -1;
    if (Math.abs(pos[i3+1]) > 6) velocities[i3+1] *= -1;
    if (Math.abs(pos[i3+2]) > 6) velocities[i3+2] *= -1;
  }
  
  particlesGeometry.attributes.position.needsUpdate = true;

  // Create/Update lines
  if (linesMesh) scene.remove(linesMesh);
  
  const linePositions = [];
  for (let i = 0; i < particlesCount; i++) {
    for (let j = i + 1; j < particlesCount; j++) {
      const dist = Math.sqrt(
        Math.pow(pos[i*3] - pos[j*3], 2) +
        Math.pow(pos[i*3+1] - pos[j*3+1], 2) +
        Math.pow(pos[i*3+2] - pos[j*3+2], 2)
      );

      if (dist < 2.5) {
        linePositions.push(pos[i*3], pos[i*3+1], pos[i*3+2]);
        linePositions.push(pos[j*3], pos[j*3+1], pos[j*3+2]);
      }
    }
  }

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  linesMesh = new THREE.LineSegments(lineGeometry, linesMaterial);
  scene.add(linesMesh);
}

function animate() {
  updateNetwork();
  
  // Subtle parallax
  scene.rotation.y = mouseX * 0.1;
  scene.rotation.x = -mouseY * 0.1;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// --- Navigation Scroll Effect ---
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// --- GSAP: Smooth Reveal Animations ---
window.addEventListener('load', () => {
  gsap.utils.toArray('.reveal').forEach((elem) => {
    gsap.fromTo(elem, 
      { opacity: 0, y: 40 }, 
      { 
        opacity: 1, y: 0, duration: 1.2, ease: "power3.out",
        scrollTrigger: {
          trigger: elem,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );
  });

  // Hero Parallax
  gsap.to('.hero-title', {
    yPercent: -20,
    scrollTrigger: {
      trigger: '.hero',
      scrub: true
    }
  });
});

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
