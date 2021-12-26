import * as THREE from 'https://cdn.skypack.dev/three@0.135.0'
import {OrbitControls} from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/controls/OrbitControls.js'
import * as dat from 'https://cdn.skypack.dev/dat.gui'


class MapCenter {
    constructor() {
        this.neighbors = [];
        this.borders = [];
        this.corners = [];
        this.x = 0;
        this.y = 0;
        this.processed = false;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
}

class MapEdge {
    constructor() {
        this.d0 = null;
        this.d1 = null;
        this.v0 = null;
        this.v1 = null;
    }
}

class MapCorner {
    constructor() {
        this.touches = [];
        this.protrodes = [];
        this.adjent = [];
        this.x = 0;
        this.y = 0;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
}

class MapGraph{
    constructor(diagram, sites) {
        this.polygons = [];
        this.edges = [];
        this.corners = [];
        this.diagram = diagram;
        this.sites = sites;
    }

    buildCenters(){
        let centers = [];
        for(let i = 0; i < this.diagram.cells.length; i++) {
            let tmp_site = this.diagram.cells[i].site;
            let center = new MapCenter();
            center.setPosition(tmp_site.x, tmp_site.y);
            centers.push(center);
        }
        this.polygons = centers;
    }

    getRight(halfEdge) {
        if (halfEdge.site.voronoiId == halfEdge.edge.lSite.voronoiId) {
            return {
                rigthSite: halfEdge.edge.rSite,
                rightVertex: halfEdge.edge.va
            };
        } else {
            return {
                rigthSite: halfEdge.edge.lSite,
                rightVertex: halfEdge.edge.vb
            };
        }
    }

    build() {
        this.buildCenters();
        // Se recorren todas las celdas
        for (let i = 0; i < this.diagram.cells.length; i++) {
            console.log("Cell ", i);
            console.log(this.polygons[i].processed);
            console.log(this.polygons[i]);
            let cell = this.diagram.cells[i];
            // Se recorren los halfedges de la celda
            let heLength = cell.halfedges.length,
                centers = [],
                corners = [],
                edges = [],
                edgesReady = [],
                cornersReady = [],
                prevReady = false;
            
            // Primera pasada
            for (let j = 0; j < heLength; j++) {
                console.log("   halfedge ", j);
                let hedge = cell.halfedges[j];
                let {rigthSite, rightVertex} = this.getRight(hedge);

                // Procesamiento de edges
                
                // SI ya fue inicializado
                if (rigthSite != null &&  
                    this.polygons[rigthSite.voronoiId].processed) 
                {
                    console.log("   cell inited");
                    let op_edges = this.polygons[rigthSite.voronoiId].borders;
                    console.log(op_edges);
                    // Recorrer los halfedges del poligono opuesto y encontrar el halfedge opuesto:
                    for (let k = 0; k < op_edges.length; k++) {
                        if (op_edges[k].d1 == this.polygons[i] || op_edges[k].d0 == this.polygons[i]){
                            // Añadir el Edge encontrado
                            edges.push(op_edges[k]);
                            console.log("----> Edge Founded");
                        }
                    }
                    centers.push(this.polygons[rigthSite.voronoiId])
                    edgesReady.push(true);
                }
                
                // SI NO fue inicializado
                else {
                    let edge = new MapEdge(); // Se crea un nuevo Edge
                    edge.d0 = this.polygons[i];  // Se conectan d0 y d1 al Edge
                    if (rigthSite != null) {
                        edge.d1 = this.polygons[rigthSite.voronoiId];
                        centers.push(this.polygons[rigthSite.voronoiId]); // Se conectan un neighbor al center actual
                    }
                    edges.push(edge); // Añadir el Edge creado
                    this.edges.push(edge); // Se añade el Edge creado al arreglo genera
                    edgesReady.push(false); // Se añade el Edge creado al arreglo general
                }
                // -------------------------->
                // Procesamiento de corners

                // SI el anterior fue inicializado:
                if (prevReady) {
                    // Setear a que no fue inicializado
                    prevReady = false;
                    cornersReady.push(true);
                }
                else {
                // Si el anterior no fue inicializado:
                    // SI ya fue inicializado este corner 
                    if (rigthSite != null &&  
                        this.polygons[rigthSite.voronoiId].processed) 
                    {   
                        let op_edges = this.polygons[rigthSite.voronoiId].borders;
                        console.log("Here");
                        console.log(this.polygons[i] );
                        console.log(op_edges);
                        // Recorrer los halfedges del poligono opuesto y encontrar el halfedge opuesto:
                        for (let k = 0; k < op_edges.length; k++) {
                            if (op_edges[k].d1 == this.polygons[i] || op_edges[k].d0 == this.polygons[i]){
                                // Añadir los dos corners de manera inversa
                                corners.push(op_edges[k].v1);
                                corners.push(op_edges[k].v0);
                                // Setear que el anterior fue inicializado
                                prevReady = true;
                            }
                        }
                        cornersReady.push(true);
                    }
                    // SI NO fue inicializado
                    else {
                        let corner = new MapCorner(); // Se crea un nuevo Corner
                        corner.setPosition(rightVertex.x, rightVertex.y); // Se setea la posicion al corner
                        corners.push(corner);
                        // Se añade el Edge creado al arreglo general
                        this.corners.push(corner); // Se añade el Edge creado al arreglo genera
                        cornersReady.push(false); // Se añade el Edge creado al arreglo general
                    }
                }
            }

            // Segunda pasada
            for (let j = 0; j < heLength; j++) {
                // Procesamiento de edges

                // SI el actual fue inicializado y el siguiente no
                if (edgesReady[j] && !(edgesReady[(j+1)%heLength]) ) {
                    // Al corner+1 se le enlaza el edge siguiente
                    console.log(j);
                    console.log(heLength);
                    console.log(corners);
                    corners[(j+1)%heLength].protrodes.push(edges[(j+1)%heLength]);
                    // Al corner+1 se le enlaza el corner+2
                    corners[(j+1)%heLength].adjent.push(corners[(j+2)%heLength]);
                }
                else if(!edgesReady[j]){
                    // SI NO fue inicializado

                    // Se añade al edge los corner v0 y v1
                    edges[j].v0 = corners[j];
                    edges[j].v1 = corners[(j+1) % heLength];

                }

                // -------------------------->
                // Procesamiento de corners

                // SI ya fue inicializado

                // SI NO fue inicializado
                if (!cornersReady[j]){
                    // Se conectan los tres centers a touches del corner actual
                    //console.log(j);
                    //console.log(corners);
                    corners[j].touches.push(this.polygons[i]);
                    let hedge = cell.halfedges[j];
                    let {rigthSite, rightVertex} = this.getRight(hedge);
                    if (rigthSite != null) {
                        corners[j].touches.push(this.polygons[rigthSite.voronoiId]);
                    }
                    let idxPrev = (j+ heLength-1)%heLength;
                    let hedgePrev = cell.halfedges[idxPrev];
                    let {rigthSitePrev, rightVertexPrev} = this.getRight(hedge);
                    if (rigthSitePrev != null) {
                        corners[j].touches.push(this.polygons[rigthSitePrev.voronoiId]);
                    }
                    // Se conecta el Edge posterior a protrodes del corner actual
                    corners[j].protrodes.push(edges[j]);
                    // Se conecta el Edge anterior a protrodes del corner actual
                    corners[j].protrodes.push(edges[idxPrev]);
                    // Se conecta el corner posterior a adjent del corner actual
                    corners[j].adjent.push(this.corners[(j+1)%heLength]);
                    // Se conecta el corner anterior a adjent del corner actual
                    corners[j].adjent.push(this.corners[idxPrev]);
                }
            }
            this.polygons[i].neighbors = centers;
            this.polygons[i].borders = edges;
            this.polygons[i].corners = corners;
            console.log("End ");
            console.log(this.polygons[i]);
            this.polygons[i].processed = true;

        }
    }
}

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
        //console.log("Compute");
        //console.log(sites);
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
    //console.log(voronoiGen.diagram.edges.length);

    let mGraph = new MapGraph(voronoiGen.diagram, voronoiGen.sites);
    mGraph.build();
    console.log(mGraph.polygons);
    console.log(mGraph.edges);
    console.log(mGraph.corners);

    let pointsGeometry = new THREE.BufferGeometry();
    const vCenters = voronoiGen.getCenters();
    let randIdx = Math.floor(Math.random() * voronoiGen.diagram.cells.length);
    let idx = voronoiGen.diagram.cells[randIdx].halfedges[0].edge.lSite.voronoiId;
    //console.log(voronoiGen.diagram.cells[randIdx].halfedges[0].edge.va);
    //console.log(voronoiGen.diagram.cells[idx]);
    //console.log(voronoiGen.diagram.cells[1]);
    //console.log(voronoiGen.diagram);
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
    const vEdges = [];
    for (let i = 0; i < mGraph.polygons.length; i++){
        let poly = mGraph.polygons[i];
        for (let j = 0; j < poly.borders.length; j++) {
            vEdges.push(poly.borders[j].v0.x, poly.borders[j].v0.y ,zCoord);
            vEdges.push(poly.borders[j].v1.x, poly.borders[j].v1.y ,zCoord);
        }
        
    }

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