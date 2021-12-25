import * as THREE from 'https://cdn.skypack.dev/three@0.135.0'
import {OrbitControls} from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/controls/OrbitControls.js'
import * as dat from 'https://cdn.skypack.dev/dat.gui'


function genPoints(minX, maxX, minY, maxY, zCoord) {
    const particles = 1000; // Number of points
    let pointsGeometry = new THREE.BufferGeometry();

    let vertices = []; // Array of vertices
    
    let width = maxX - minX;
    let height = maxY - minX;

    let voronoi = new Voronoi();
    let bbox = {xl: minX, xr: maxX, yt: minY, yb: maxY}; 
    let sites = [];

    // Generate the initial random points
    for (let i = 0; i < particles; i++) {
        let x_point = minX + Math.random() * width;
        let y_point = minY + Math.random() * height;

        vertices.push(x_point, y_point, zCoord);
        sites.push({x: x_point, y:y_point});
    }
    
    // Create the geometry of the points
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    pointsGeometry.computeBoundingSphere();

    // Create the material pf the points
    let pointsMaterial = new THREE.PointsMaterial({
        size : 0.03,
        color: 0xff0000,
        sizeAttenuation: true
    });

    // Create the points Object
    let p = new THREE.Points(pointsGeometry, pointsMaterial);

    let diagram = voronoi.compute(sites, bbox);
    console.log(diagram.edges.length);

    const lineMaterial = new THREE.LineBasicMaterial( {color: 0x0000ff } );
    const linePoints = [];

    for (let i = 0 ; i < diagram.edges.length; i++) {
        let edge = diagram.edges[i];
        linePoints.push( new THREE.Vector3(edge.va.x, edge.va.y, zCoord ) );
        linePoints.push( new THREE.Vector3(edge.vb.x, edge.vb.y, zCoord ) );
    }

    const lineGeometry = new THREE.BufferGeometry().setFromPoints( linePoints );
    const l = new THREE.LineSegments( lineGeometry, lineMaterial );

    return {
        points: p, 
        lines: l};
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
    //camera.lookAt(0, 0, 0);  
    
    const renderer = new THREE.WebGLRenderer();
    
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    
    camera.up.set(0, 0, 1);
    new OrbitControls(camera, renderer.domElement);
    camera.position.z = 5;
    camera.rotation.set(0, 0, 0);
    console.log(camera);
    
    const planeGeometry = new THREE.PlaneGeometry(world.plane.width, world.plane.height, 10, 10);
    const planeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFFFFF,
        side: THREE.DoubleSide});
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(planeMesh);

    let {points, lines} = genPoints(-world.plane.width/2, world.plane.width/2, -world.plane.height/2, world.plane.height/2, 0.001);
    scene.add(points);
    scene.add(lines);
    
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