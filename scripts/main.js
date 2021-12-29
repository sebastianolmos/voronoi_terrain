import * as THREE from 'https://cdn.skypack.dev/three@0.135.0'
import {OrbitControls} from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/controls/OrbitControls.js'
import * as dat from 'https://cdn.skypack.dev/dat.gui'
import {Voronoi} from './rhill-voronoi-core.js'
import {VoronoiGenerator} from './voronoiGenerator.js'
import * as MAP from './mapGraph.js'
import {genNoise} from './noiseGenerator.js'

const POINTS = 50000;
const WORLD_WIDTH = 7;
const WORLD_HEIGHT = 7;
const WORLD_Z = 0;
const VORONOI_RELAXATION = 15;
// Perlin noise constants
const NOISE_SIZE = 512;
const NOISE_DRAW_HEIGHT = 0.001;
const NOISE_GRADIENT_VALUE = 0.42;
const NOISE_RADIUS = 0.263;


let seed = 90660;
let mGraph = null;
// Perlin noise parameters
const noise = {
    seed: 0.676,
    scale: 12.604
};

function genMapGraph() {
    let voronoiGen = new VoronoiGenerator(WORLD_WIDTH, WORLD_HEIGHT, WORLD_Z, POINTS, seed);
    voronoiGen.relaxate(VORONOI_RELAXATION);
    mGraph = new MAP.MapGraph(voronoiGen.diagram, voronoiGen.sites);
    mGraph.build();
}

function fillMap() {
    let noiseImg = genNoise(NOISE_SIZE, noise.seed, NOISE_DRAW_HEIGHT, NOISE_GRADIENT_VALUE, NOISE_RADIUS, noise.scale);

    for (let i = 0; i < mGraph.corners.length; i++) {
        let corner =  mGraph.corners[i];
        let x =  Math.floor((corner.x + WORLD_WIDTH/2) * NOISE_SIZE/WORLD_WIDTH);
        let y =  Math.floor((corner.y + WORLD_HEIGHT/2) * NOISE_SIZE/WORLD_HEIGHT);
        let cell = (x + y * NOISE_SIZE);
        if (noiseImg[cell] == 0) {
            corner.water = true;
        } else {
            corner.water = false;
        }
    }

    for (let i = 0; i < mGraph.polygons.length; i++) {
        let poly =  mGraph.polygons[i];
        poly.water = false;
        poly.ocean = false;
        poly.coast = false;
        poly.elevation = 0;
        poly.downSlope = null;
        poly.normal = {x: 0.0, y: 0.0, z: 1.0};
        
        for (let j = 0; j < poly.corners.length; j++) {
            if ( poly.corners[j].water){
                poly.water = true;
                break;
            }
        }
    }
    mGraph.markCenters();
    mGraph.markCorners();
    mGraph.setElevations(0.035);
    console.log(mGraph.maxHeight);
}

function pickColor(heigth, maxHeight) {
    const gradientColor = [
        {r: 0.941, g: 0.823, b: 0.658},
        {r: 0.580, g: 0.882, b: 0.239},
        {r: 0.254, g: 0.835, b: 0.062},
        {r: 0.086, g: 0.654, b: 0.250},
        {r: 0.450, g: 0.627, b: 0.537},
        {r: 0.694, g: 0.756, b: 0.788},
        {r: 0.925, g: 0.964, b: 0.972},
    ];

    let c = heigth / maxHeight * (gradientColor.length -2);
    let idx = Math.floor(c);
    let t = c - idx;
    let c1 = gradientColor[idx];
    let c2 = gradientColor[idx + 1];
    //console.log(idx);

    return {
        r: c1.r * (1-t) + c2.r*t,
        g: c1.g * (1-t) + c2.g*t,
        b: c1.b * (1-t) + c2.b*t
    };
}

function genTerrain() {
    
    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];
    let indexCount = 0;
    for (let i = 0; i < mGraph.polygons.length; i++){
        let poly = mGraph.polygons[i];
        let polyLen = poly.corners.length;
        for(let j = 0; j < polyLen; j++) {
            
            let polyColor = {r: 0.2, g: 0.3, b: 1.0};
            if (!poly.water) {
            polyColor = pickColor(poly.corners[j].elevation, mGraph.maxHeight);
            } 
            else if (!poly.ocean) {
                polyColor = {r: 0.0, g: 0.8, b: 1.0};
            } 
            positions.push(poly.corners[j].x, poly.corners[j].y, poly.corners[j].elevation);
            normals.push(-poly.corners[j].normal.x, -poly.corners[j].normal.y, -poly.corners[j].normal.z);
            colors.push(polyColor.r, polyColor.g, polyColor.b);
            indices.push(indexCount + j, indexCount + (j+1)%polyLen, indexCount + polyLen);
        }
        let polyColor = {r: 0.2, g: 0.3, b: 1.0};
        if (!poly.water) {
        polyColor = pickColor(poly.elevation, mGraph.maxHeight);
        } 
        else if (!poly.ocean) {
            polyColor = {r: 0.0, g: 0.8, b: 1.0};
        } 
        positions.push(poly.x, poly.y, poly.elevation);
        normals.push(-poly.normal.x, -poly.normal.y, -poly.normal.z);
        colors.push(polyColor.r, polyColor.g, polyColor.b);
        indexCount += polyLen + 1;
    }
    const terrainGeometry = new THREE.BufferGeometry();
    const positionNumComponents = 3;
    const colorNumComponents = 3;
    const normalNumComponents = 3;
    terrainGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
    terrainGeometry.setAttribute(
        'color',
        new THREE.BufferAttribute(new Float32Array(colors), colorNumComponents));
    terrainGeometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
    terrainGeometry.setIndex(indices);
    const terrainMaterial = new THREE.MeshPhongMaterial({
        vertexColors: THREE.VertexColors, 
        side: THREE.DoubleSide,
        clipShadows: true,
        shadowSide: THREE.BackSide});
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
    fillMap();
    
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
    terrain.name = "terrain";
    scene.add(terrain);
    //let {points, lines, delaunay, voronoi} = genPoints();
    //scene.add(points);
    //scene.add(lines);
    //scene.add(delaunay);
    //scene.add(voronoi);
    
    let obj = { Refresh:function() {
        let object = scene.getObjectByName("terrain");
        scene.remove(object);
        object.geometry.dispose();
        object.material.dispose();
        
        fillMap();
        let nTerrain = genTerrain();
        nTerrain.name = "terrain"
        scene.add(nTerrain);
    }};
    gui.add(obj,'Refresh');
    gui.add(noise, 'seed', 0.0, 1.0).step(0.001);
    gui.add(noise, 'scale', 2.56, 15.36).step(0.001);
    
    const ambientColor = 0xFFFFFF;
    const ambientIntensity = 0.5;
    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff, 0.7);
    light.position.set(-5, 0, 7);
    light.target.position.set(0, 0, 0);
    scene.add(light);

    function render(time) {
        time *= 0.001;  // convert time to seconds
        
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
}

main();