import * as THREE from 'https://cdn.skypack.dev/three@0.135.0';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, 
    innerWidth / innerHeight,
    0.1,
    1000
)
camera.position.z = 5

const renderer = new THREE.WebGLRenderer()

renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(devicePixelRatio)
document.body.appendChild(renderer.domElement)

const planeGeometry = new THREE.PlaneGeometry(5, 5, 10, 10)
const planeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff0000,
    side: THREE.DoubleSide})
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
scene.add(planeMesh)

function render(time) {
    time *= 0.001;  // convert time to seconds
    
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
requestAnimationFrame(render);