import * as THREE from 'https://cdn.skypack.dev/three@0.135.0'
import {OrbitControls} from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/controls/OrbitControls.js'
import * as dat from 'https://cdn.skypack.dev/dat.gui'
import {Voronoi} from './rhill-voronoi-core.js'
import {VoronoiGenerator} from './voronoiGenerator.js'
import * as MAP from './mapGraph.js'

function genPoints(minX, maxX, minY, maxY, zCoord) {
    const particles = 1000; // Number of points
    let width = maxX - minX;
    let height = maxY - minY;

    let voronoiGen = new VoronoiGenerator(width, height, zCoord, particles);
    voronoiGen.relaxate(20);
    //console.log(voronoiGen.diagram.edges.length);

    let mGraph = new MAP.MapGraph(voronoiGen.diagram, voronoiGen.sites);
    mGraph.build();
    console.log(mGraph.polygons);
    console.log(mGraph.edges);
    console.log(mGraph.corners);

    let pointsGeometry = new THREE.BufferGeometry();
    const vCenters = voronoiGen.getCenters();
    // Create the geometry of the points
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vCenters, 3));
    pointsGeometry.computeBoundingSphere();

    // Create the material pf the points
    let pointsMaterial = new THREE.PointsMaterial({
        size : 0.03,
        color: 0xff0000,
        sizeAttenuation: true
    });

    // Create the points Object
    let p = new THREE.Points(pointsGeometry, pointsMaterial);

    let voronoiGeometry = new THREE.BufferGeometry();
    let vPoints = [];
    for (let i = 0; i < mGraph.corners.length; i++){
        vPoints.push(mGraph.corners[i].x, mGraph.corners[i].y, zCoord);
    }
    voronoiGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vPoints, 3));
    voronoiGeometry.computeBoundingSphere();
    // Create the material pf the points
    let voronoiMaterial = new THREE.PointsMaterial({
        size : 0.03,
        color: 0x0000FF,
        sizeAttenuation: true
    });

    // Create the points Object
    let v = new THREE.Points(voronoiGeometry, voronoiMaterial);


    const lineMaterial = new THREE.LineBasicMaterial( {color: 0xFFFFFF } );
    const delaunayMaterial = new THREE.LineBasicMaterial( {color: 0x000000 } );

    const vEdges = [];
    const dEdges = [];
    for (let i = 0; i < mGraph.edges.length; i++){
        vEdges.push(mGraph.edges[i].v0.x, mGraph.edges[i].v0.y ,zCoord -0.0001);
        vEdges.push(mGraph.edges[i].v1.x, mGraph.edges[i].v1.y ,zCoord-0.0001);

        let d0 = mGraph.edges[i].d0;
        let d1 = mGraph.edges[i].d1;
        if (d0 != null && d1 != null){
            dEdges.push(mGraph.edges[i].d0.x, mGraph.edges[i].d0.y ,zCoord-0.0001);
            dEdges.push(mGraph.edges[i].d1.x, mGraph.edges[i].d1.y ,zCoord-0.0001);
        }
        
    }

    let lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vEdges, 3));
    const l = new THREE.LineSegments( lineGeometry, lineMaterial );

    let delaunayGeometry = new THREE.BufferGeometry();
    delaunayGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dEdges, 3));
    const d = new THREE.LineSegments( delaunayGeometry, delaunayMaterial );

    return {
        points: p, 
        lines: l,
        delaunay: d,
        voronoi: v};
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
    const planeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x777777,
        side: THREE.DoubleSide});
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(planeMesh);

    let {points, lines, delaunay, voronoi} = genPoints(-world.plane.width/2, world.plane.width/2, -world.plane.height/2, world.plane.height/2, 0.001);
    scene.add(points);
    scene.add(lines);
    scene.add(delaunay);
    scene.add(voronoi);
    
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