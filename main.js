import * as THREE from 'https://cdn.skypack.dev/three@0.135.0'
import {OrbitControls} from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/controls/OrbitControls.js'
import * as dat from 'https://cdn.skypack.dev/dat.gui'

const gui = new dat.GUI()
const world = {
    plane: {
        width: 10,
        height: 10
    }
}
gui.add(world.plane, "width", 1, 20).onChange(generatePlane)
gui.add(world.plane, "height", 1, 20).onChange(generatePlane)

function generatePlane() {
    planeMesh.geometry.dispose()
    planeMesh.geometry = new THREE.PlaneGeometry(world.plane.width, world.plane.height, 10, 10)
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, 
    innerWidth / innerHeight,
    0.1,
    1000
)
camera.up.set(0, 0, 1);
//camera.lookAt(0, 0, 0);  

const renderer = new THREE.WebGLRenderer()

renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(devicePixelRatio)
document.body.appendChild(renderer.domElement)

new OrbitControls(camera, renderer.domElement)
camera.position.z = 5

const planeGeometry = new THREE.PlaneGeometry(5, 5, 10, 10)
const planeMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xff0000,
    side: THREE.DoubleSide})
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
scene.add(planeMesh)

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(0, 0, 1)
scene.add(light)

function render(time) {
    time *= 0.001;  // convert time to seconds
    
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
requestAnimationFrame(render);