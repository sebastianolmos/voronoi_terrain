import * as THREE from 'https://cdn.skypack.dev/three@0.135.0'
import {OrbitControls} from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/controls/OrbitControls.js'
import * as dat from 'https://cdn.skypack.dev/dat.gui'
import {Voronoi} from './rhill-voronoi-core.js'
import {VoronoiGenerator} from './voronoiGenerator.js'
import * as MAP from './mapGraph.js'

const POINTS = 1000;
const WORLD_WIDTH = 7;
const WORLD_HEIGHT = 7;
const WORLD_Z = 0;
const VORONOI_RELAXATION = 25;

let seed = 10240;
let mGraph = null;

function genMapGraph() {
    let voronoiGen = new VoronoiGenerator(WORLD_WIDTH, WORLD_HEIGHT, WORLD_Z, POINTS, seed);
    voronoiGen.relaxate(VORONOI_RELAXATION);
    mGraph = new MAP.MapGraph(voronoiGen.diagram, voronoiGen.sites);
    mGraph.build();
}

function genTerrain() {
    const positions = [];
    const colors = [];
    const indices = [];
    let indexCount = 0;
    for (let i = 0; i < mGraph.polygons.length; i++){
        let randColor = {r: Math.random(), g: Math.random(), b: Math.random()};
        let poly = mGraph.polygons[i];
        let polyLen = poly.corners.length;
        for(let j = 0; j < polyLen; j++) {
            positions.push(poly.corners[j].x, poly.corners[j].y, WORLD_Z);
            colors.push(randColor.r, randColor.g, randColor.b);
            indices.push(indexCount + j, indexCount + (j+1)%polyLen, indexCount + polyLen);
        }
        positions.push(poly.x, poly.y, WORLD_Z);
        colors.push(randColor.r, randColor.g, randColor.b);
        indexCount += polyLen + 1;
    }
    const terrainGeometry = new THREE.BufferGeometry();
    const positionNumComponents = 3;
    const colorNumComponents = 3;
    terrainGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
    terrainGeometry.setAttribute(
        'color',
        new THREE.BufferAttribute(new Float32Array(colors), colorNumComponents));
    terrainGeometry.setIndex(indices);
    const terrainMaterial = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors, side: THREE.BackSide});
    const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
    return terrainMesh;
}

function genPoints() {
    let zCoord = WORLD_Z + 0.001;

    let pointsGeometry = new THREE.BufferGeometry();
    let vCenters = [];
    for (let i = 0; i < mGraph.polygons.length; i++){
        vCenters.push(mGraph.polygons[i].x, mGraph.polygons[i].y, zCoord);
    }
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

    genMapGraph();
    
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
    
    const planeGeometry = new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_HEIGHT, 10, 10);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x777777,
        side: THREE.DoubleSide});
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    //scene.add(planeMesh);

    let terrain = genTerrain();
    scene.add(terrain);

    let {points, lines, delaunay, voronoi} = genPoints();
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