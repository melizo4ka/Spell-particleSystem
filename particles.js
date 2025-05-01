import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function createGlowingCircleTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, size, size);
    
    // the particle consists of a white center, some colour around it
    const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 4
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 240, 220, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 100, 20, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 40, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
}

// function for the glow effect
export function setupBloomEffect(scene, camera, renderer) {
    const renderScene = new RenderPass(scene, camera);
    
    // creating bloom pass
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        // bloom strength, radius, threshold
        1.5,
        0.4,
        0.85
    );
    
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    
    window.addEventListener('resize', () => {
        composer.setSize(window.innerWidth, window.innerHeight);
    });
    
    return composer;
}

// base composition - paricles moving around everywhere
export function createRandomParticleSystem(count, onReady) {
    const positions = [];
    const colors = [];
    const sizes = [];
    const orbitCenters = [];
    const angles = [];
    
    const spreadRange = 40;
    
    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 2 * spreadRange;
        const y = (Math.random() - 0.5) * 2 * spreadRange;
        const z = (Math.random() - 0.5) * 2 * spreadRange;
        
        positions.push(x, y, z);
        
        orbitCenters.push(x, y, z);
        
        angles.push(Math.random() * Math.PI * 2);
        
        // glow colour
        const hue = 0.05 + Math.random() * 0.1;
        const saturation = 0.8 + Math.random() * 0.2;
        const lightness = 0.6 + Math.random() * 0.3;
        
        // HSL to RGB
        const color = new THREE.Color().setHSL(hue, saturation, lightness);
        colors.push(color.r, color.g, color.b);
        
        sizes.push(3 + Math.random() * 4);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    geometry.userData.orbitCenters = orbitCenters;
    geometry.userData.angles = angles;
    geometry.userData.targetPositions = positions.slice();
    geometry.userData.isAnimating = false;
    geometry.userData.animationProgress = 0;
    
    const material = new THREE.PointsMaterial({
        size: 7,
        map: createGlowingCircleTexture(),
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    
    // changing particles' shapes 
    material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
            'gl_PointSize = size;', 
            'gl_PointSize = size * 1.5;'
        );
    };
    
    const particles = new THREE.Points(geometry, material);
    
    // some light sources for the glow
    const lightGroup = new THREE.Group();
    const lightIndices = [];
    
    const particleSystem = new THREE.Group();
    particleSystem.add(particles);
    particleSystem.add(lightGroup);
    particleSystem.userData.particles = particles;
    particleSystem.userData.lights = lightGroup;
    particleSystem.userData.lightIndices = lightIndices;
    
    onReady(particleSystem);
}

// updating with keybord input
export function updateParticleSystemFromText(particleSystem, text, onReady) {
    const loader = new FontLoader();
    loader.load(
    'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
    (font) => {
        const textGeometry = new TextGeometry(text, {
        font: font,
        size: 20,
        height: 5,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 0.3,
        bevelSegments: 2,
        });
        
        textGeometry.computeBoundingBox();
        const centerOffset = textGeometry.boundingBox.getCenter(new THREE.Vector3()).negate();
        textGeometry.translate(centerOffset.x, centerOffset.y, centerOffset.z);
        
        const mesh = new THREE.Mesh(textGeometry);
        
        const sampler = new MeshSurfaceSampler(mesh).build();
        
        const particles = particleSystem.userData.particles;
        const count = particles.geometry.attributes.position.count;
        const tempPosition = new THREE.Vector3();
        
        const currentPositions = Array.from(particles.geometry.attributes.position.array);
        const newTargetPositions = [];
        
        for (let i = 0; i < count; i++) {
            sampler.sample(tempPosition);
            newTargetPositions.push(tempPosition.x, tempPosition.y, tempPosition.z);
        }
        
        // to animate the movement
        particles.geometry.userData.startPositions = currentPositions;
        particles.geometry.userData.targetPositions = newTargetPositions;
        particles.geometry.userData.isAnimating = true;
        particles.geometry.userData.animationProgress = 0;
        
        onReady(particleSystem);
    },
    undefined,
    (error) => {
        console.error('Error loading font:', error);
    }
    );
}

export function animateParticles(particleSystem, deltaTime) {
    if (!particleSystem) return;
    
    const particles = particleSystem.userData.particles;
    const positions = particles.geometry.attributes.position.array;
    const orbitCenters = particles.geometry.userData.orbitCenters;
    const angles = particles.geometry.userData.angles;
    
    // transition animation
    if (particles.geometry.userData.isAnimating) {
        const startPositions = particles.geometry.userData.startPositions;
        const targetPositions = particles.geometry.userData.targetPositions;
        const animationSpeed = 0.005;
        
        particles.geometry.userData.animationProgress += animationSpeed;
        const progress = particles.geometry.userData.animationProgress;
        
        // smoothing the animation
        const ease = (t) => {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };
        
        const easedProgress = ease(progress);
        
        // animating positions
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] = startPositions[i] * (1 - easedProgress) + targetPositions[i] * easedProgress;
            positions[i + 1] = startPositions[i + 1] * (1 - easedProgress) + targetPositions[i + 1] * easedProgress;
            positions[i + 2] = startPositions[i + 2] * (1 - easedProgress) + targetPositions[i + 2] * easedProgress;
            orbitCenters[i] = positions[i];
            orbitCenters[i + 1] = positions[i + 1];
            orbitCenters[i + 2] = positions[i + 2];
        }
        
        if (particleSystem.userData.lights) {
            const lights = particleSystem.userData.lights.children;
            const lightIndices = particleSystem.userData.lightIndices;     
            for (let i = 0; i < lights.length; i++) {
                const idx = lightIndices[i];
                lights[i].position.set(
                    positions[idx], 
                    positions[idx + 1], 
                    positions[idx + 2]
                );
            }
        }
        
        if (progress >= 1.0) {
            particles.geometry.userData.isAnimating = false;
            particles.geometry.userData.animationProgress = 0;
        }
    } else {
        const baseSpeed = 0.01;
        const baseRadius = 1;
        
        for (let i = 0; i < positions.length; i += 3) {
            const centerX = orbitCenters[i];
            const centerY = orbitCenters[i + 1];
            const centerZ = orbitCenters[i + 2];
            
            // speed, radius, movement on Y, circular motion - different for each particle
            const speedVariation = 0.5 + Math.sin(i * 0.1) * 0.5;
            const particleSpeed = baseSpeed * (1 + speedVariation * 0.5);
            angles[i / 3] += particleSpeed;
            const radiusVariation = 0.5 + Math.cos(i * 0.3) * 0.5;
            const particleRadius = baseRadius * (1 + radiusVariation * 0.7);
            const verticalAmount = 1.5;
            const verticalFreq = 2.3;
            const verticalOffset = Math.sin(angles[i / 3] * verticalFreq) * verticalAmount;
            const angle = angles[i / 3];
            positions[i] = centerX + Math.cos(angle) * particleRadius;
            positions[i + 1] = centerY + verticalOffset;
            positions[i + 2] = centerZ + Math.sin(angle) * particleRadius;
        }
        
        if (particleSystem.userData.lights) {
            const lights = particleSystem.userData.lights.children;
            const lightIndices = particleSystem.userData.lightIndices;
            for (let i = 0; i < lights.length; i++) {
                const idx = lightIndices[i];
                lights[i].position.set(
                    positions[idx], 
                    positions[idx + 1], 
                    positions[idx + 2]
                );
            }
        }
    }
    
    particles.geometry.attributes.position.needsUpdate = true;
}