import * as THREE from 'https://cdn.skypack.dev/three@0.135.0'
import {OrbitControls} from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/controls/OrbitControls.js'
import * as dat from 'https://cdn.skypack.dev/dat.gui'

class VoronoiGenerator {
    constructor(width, height, zCoord, points) {
        this.voronoi = new Voronoi();
        this.bBox = {xl: -width/2, xr: width/2, yt: -height/2, yb: height/2};
        this.sites = [];
        this.z = zCoord;
        this.randomSites(points);
        this.diagram = this.voronoi.compute(this.sites, this.bBox);
    }

    randomSites(n) {
        let sites = [];
        // Generate the initial random points
        let width = this.bBox.xr - this.bBox.xl;
        let height = this.bBox.yb - this.bBox.yt;
        for (let i = 0; i < n; i++) {
            let x_point = this.bBox.xl + Math.random() * width;
            let y_point = this.bBox.yt + Math.random() * height;
            sites.push({x: x_point, y:y_point});
        }
        this.sites = sites;
    }

    relaxSites() {
        if (!this.diagram) {
            return;
        }
        let cells = this.diagram.cells,
            iCell = cells.length,
            cell,
            site, 
            sites = [];
        console.log(iCell)
        while (iCell--){
            cell = cells[iCell];
            site = this.cellCentroid(cell);
            sites.push(site);
        }
        this.compute(sites);
    }

    distance(a, b) {
        let dx = a.x - b.x;
            dy = a.y - b.y;   
        return Math.sqrt(dx*dx +dy*dy);     
    }

    cellArea(cell) {
        let area = 0,
            halfedges = cell.halfedges,
            iHalfedge = halfedges.length,
            halfedge,
            p1, p2;
        while (iHalfedge--){
            halfedge = halfedges[iHalfedge];
            p1 = halfedge.getStartpoint();
            p2 = halfedge.getEndpoint();
            area += p1.x * p2.y;
            area -= p1.y * p2.x;
        }
        area /= 2;
        return area;
    }

    cellCentroid(cell) {
        let x = 0, y = 0,
            halfedges = cell.halfedges,
            iHalfedge = halfedges.length,
            halfedge,
            v, p1, p2;  
        while (iHalfedge--) {
            halfedge = halfedges[iHalfedge];
            p1 = halfedge.getStartpoint();
            p2 = halfedge.getEndpoint();
            v = p1.x*p2.y - p2.x*p1.y;
            x += (p1.x + p2.x) * v;
            y += (p1.y + p2.y) * v;
        }
        v = this.cellArea(cell) * 6;
        return {x: x/v, y: y/v};
    }

    compute(sites) {
        this.sites = sites;
        this.diagram = this.voronoi.compute(sites, this.bBox);
        console.log("Compute");
        console.log(sites);
        //console.log(this.bBox);
        //console.log(d.edges.lenght);
    }

    getCenters(){
        let vertices = [];
        for(let i = 0; i< this.sites.length; i++){
            let site = this.sites[i];
            vertices.push(site.x, site.y, this.z);
        }
        return vertices;
    }

    getEdges(){
        let edges = []
        for (let i = 0 ; i < this.diagram.edges.length; i++) {
            let edge = this.diagram.edges[i];
            edges.push(edge.va.x, edge.va.y, this.z);
            edges.push(edge.vb.x, edge.vb.y, this.z);
        }
        return edges;
    }

    relaxate(iterations){
        for (let i = 0; i < iterations; i++){
            this.relaxSites();
        }
    }
}

function genPoints(minX, maxX, minY, maxY, zCoord) {
    const particles = 1000; // Number of points
    let width = maxX - minX;
    let height = maxY - minY;

    let voronoiGen = new VoronoiGenerator(width, height, zCoord, particles);
    voronoiGen.relaxate(20);
    console.log(voronoiGen.diagram.cells);
    //console.log(voronoiGen.diagram.edges.length);

    let pointsGeometry = new THREE.BufferGeometry();
    const vCenters = voronoiGen.getCenters();
    //console.log(voronoiGen.diagram.cells[0].halfedges.length);
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


    const lineMaterial = new THREE.LineBasicMaterial( {color: 0x0000ff } );
    const vEdges = voronoiGen.getEdges();
    console.log(vEdges);
    let lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vEdges, 3));
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