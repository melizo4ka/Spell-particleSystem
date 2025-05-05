# Magical Particle System

This is an interactive 3D particle system built with Three.js, where glowing animated particles that can morph into characters typed by the user.

## Implementation overview

- Initially spawns 200 glowing particles with randomized positions and orbital motion.
- Press any alphanumeric key to morph the particle system into the shape of that character.
- A custom radial texture gives particles a soft glowing appearance.

## Preview

### Idle Particles
<img width="960" alt="start" src="https://github.com/user-attachments/assets/471b7307-7e29-41cc-bf0e-29d227b53a83" />

### Text Morph Example (W)
<img width="960" alt="letterW" src="https://github.com/user-attachments/assets/4a4dc05f-ff45-4310-acb6-d254b414cf52" />


## Resources used

This project utilizes several modules and utilities from the [Three.js](https://threejs.org/) library, here are the components that were used: 

- Core Three.js Modules: **THREE.Scene**, **THREE.PerspectiveCamera**, **THREE.WebGLRenderer**, **THREE.Points**, **THREE.PointsMaterial**, **THREE.BufferGeometry**, **THREE.Color**, **THREE.Vector3**.
- Text & Font Rendering: **FontLoader** to load font definitions in JSON format, **TextGeometry** to create 3D text from loaded fonts.
- Postprocessing Effects: **EffectComposer** to manage a chain of postprocessing passes, **RenderPass**, **UnrealBloomPass** to add a glowing bloom effect to particles for better visuals.
- Sampling & Animation: **MeshSurfaceSampler** to randomly sample points on the surface of the text mesh, used for arranging particles into letter shapes.

## Code Structure

```
/spell-particle-system
├── index.html          # main HTML file
├── styles.css          # basic styling for canvas and UI
├── main.js             # initializes scene, renderer, and animation loop
├── camera.js           # defines the camera and mouse/zoom interaction
├── particles.js        # creates and updates the spell-inspired particle system
```

## Implementation details

### `main.js`
This file is responsible for initializing the core Three.js components:
- Creates the renderer, scene.
- Loads and manages the animation loop.
- Calls setup functions from `camera.js` and `particles.js` to integrate their functionality into the scene.

### `camera.js`
Handles camera creation and user interaction:
- Sets up a `PerspectiveCamera`.
- Adds mouse drag to move the camera around the scene.
- Enables zooming with the scroll wheel.
- Listens to window resize events to dynamically update the camera's aspect ratio.

### `particles.js`
Generates the particle system inspired by spell effects:
- Creates a cloud of particles using `THREE.Points` and `THREE.BufferGeometry`.
- Applies a custom material to simulate glowing particles.
- Updates particle positions over time for dynamic, spell-like motion.
