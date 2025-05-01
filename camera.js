import * as THREE from 'three';

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.001,
    1000
  );
  camera.position.z = 50;
  return camera;
}

export function handleCameraMovement(camera) {
  // mouse position
  const mouse = {
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    isDown: false
  };

  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // if mouse is pressed
    if (mouse.isDown) {
      const deltaX = mouse.x - mouse.prevX;
      const deltaY = mouse.y - mouse.prevY;
      
      camera.position.x += deltaX * 70;
      camera.position.y += deltaY * 700;
    }
    
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
  });
  
  window.addEventListener('mousedown', () => {
    mouse.isDown = true;
  });
  
  window.addEventListener('mouseup', () => {
    mouse.isDown = false;
  });
  
  // zooming
  window.addEventListener('wheel', (event) => {
    const zoomSpeed = 2;
    
    // deltaY < 0 for zoom in and deltaY > 0 for zoom out
    if (event.deltaY < 0) {
      // camera forward
      camera.position.z -= zoomSpeed;
    } else {
      // camera backward
      camera.position.z += zoomSpeed;
    }
    
    // to stop the browser's default action
    event.preventDefault();
  }, { passive: false });
  
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}