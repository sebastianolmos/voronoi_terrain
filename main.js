import * as THREE from 'https://cdn.skypack.dev/three@0.135.0'
import {OrbitControls} from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/controls/OrbitControls.js'
import * as dat from 'https://cdn.skypack.dev/dat.gui'


function genPoints(minX, maxX, minY, maxY, zCoord) {
    const particles = 1000;
    let geometry = new THREE.BufferGeometry();

    let positions = [];
    let colors = [];

    let color = new THREE.Color();
    
    let width = maxX - minX;
    let height = maxY - minX;
    for (let i = 0; i < particles; i++) {
        let x = minX + Math.random() * width;
        let y = minY + Math.random() * height;

        positions.push(x, y, zCoord);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();

    let material = new THREE.PointsMaterial({
        size : 0.03,
        color: 0x000000,
        sizeAttenuation: true
    });

    let p = new THREE.Points(geometry, material);
    return p;
}

function main() {
    // Create GUI Object
    const gui = new dat.GUI();
    const world = {
        plane: {
            width: 7,
            height: 7
        }
    };
    gui.add(world.plane, "width", 1, 20).onChange(generatePlane);
    gui.add(world.plane, "height", 1, 20).onChange(generatePlane);
    
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
    );
    camera.up.set(0, 0, 1);
    //camera.lookAt(0, 0, 0);  
    
    const renderer = new THREE.WebGLRenderer();
    
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    
    new OrbitControls(camera, renderer.domElement);
    camera.position.z = 5;
    
    const planeGeometry = new THREE.PlaneGeometry(world.plane.width, world.plane.height, 10, 10);
    const planeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFFFFF,
        side: THREE.DoubleSide});
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(planeMesh);

    let points = genPoints(-world.plane.width/2, world.plane.width/2, -world.plane.height/2, world.plane.height/2, 0.001);
    scene.add(points);
    
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 0, 1);
    scene.add(light);
    
    function render(time) {
        time *= 0.001;  // convert time to seconds
        
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
}

main();