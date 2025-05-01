import * as THREE from 'three';
import { createCamera, handleCameraMovement } from './camera.js';
import { 
  createRandomParticleSystem, 
  updateParticleSystemFromText,
  animateParticles,
  setupBloomEffect
} from './particles.js';

// creating the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060611);

const camera = createCamera();
handleCameraMovement(camera);

const renderer = new THREE.WebGLRenderer({ 
  canvas: document.querySelector('#bg'),
  antialias: true,
  powerPreference: "high-performance",
  stencil: false
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.setClearColor(0x060611);
document.body.appendChild(renderer.domElement);

const composer = setupBloomEffect(scene, camera, renderer);

let numOfParticles = 200;

// starting
let particleSystem;
createRandomParticleSystem(numOfParticles, (particles) => {
  particleSystem = particles;
  scene.add(particles);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const deltaTime = clock.getDelta();
  
  if (particleSystem) {
    animateParticles(particleSystem, deltaTime);
  }
  
  composer.render();
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', (event) => {
  const key = event.key;
  if (key.length === 1 && key.match(/[a-zA-Z0-9?]/)) {
    console.log(`Creating letter: ${key}`);
    
    if (particleSystem) {
      updateParticleSystemFromText(particleSystem, key.toUpperCase(), (updatedParticles) => {
        console.log('Particles transitioning to:', key.toUpperCase());
      });
    }
  }
});