export class MapCenter {
    constructor() {
        this.neighbors = [];
        this.borders = [];
        this.corners = [];
        this.x = 0;
        this.y = 0;
        this.processed = false;
        this.water = false;
        this.ocean = false;
        this.coast = false;
        this.elevation = 0;
        this.downSlope = null;
        this.normal = {x: 0.0, y: 0.0, z: 1.0};
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
}

export class MapEdge {
    constructor() {
        this.d0 = null;
        this.d1 = null;
        this.v0 = null;
        this.v1 = null;
    }
}

export class MapCorner {
    constructor() {
        this.touches = [];
        this.protrodes = [];
        this.adjent = [];
        this.x = 0;
        this.y = 0;
        this.water = false;
        this.ocean = false;
        this.coast = false;
        this.elevation = 0;
        this.downSlope = null;
        this.normal = {x: 0.0, y: 0.0, z: 1.0};
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

}

export class MapGraph{
    constructor(diagram, sites) {
        this.polygons = [];
        this.edges = [];
        this.corners = [];
        this.diagram = diagram;
        this.sites = sites;
        this.maxHeight = 0;
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
        //console.log("HF GET_R",  halfEdge);
        if (halfEdge.edge.lSite != null) {
            if (halfEdge.site.voronoiId == halfEdge.edge.lSite.voronoiId) {
                //console.log("r site", halfEdge.edge.rSite);
                return {
                    rigthSite: halfEdge.edge.rSite,
                    rightVertex: halfEdge.edge.va
                };
            } else {
                //console.log("l site", halfEdge.edge.lSite);
                return {
                    rigthSite: halfEdge.edge.lSite,
                    rightVertex: halfEdge.edge.vb
                };
            }
        } else if (halfEdge.edge.rSite != null){
            if (halfEdge.site.voronoiId == halfEdge.edge.rSite.voronoiId) {
                //console.log("r site", halfEdge.edge.rSite);
                return {
                    rigthSite: halfEdge.edge.lSite,
                    rightVertex: halfEdge.edge.vb
                };
            } else {
                return {
                    rigthSite: halfEdge.edge.rSite,
                    rightVertex: halfEdge.edge.va
                };
            } 
        } else {
            return {
                rigthSite: null,
                rightVertex: null
            };
        }
    }

    build() {
        this.buildCenters();
        // Se recorren todas las celdas
        for (let i = 0; i < this.diagram.cells.length; i++) {
            //console.log("Cell ", i);
            //console.log(this.polygons[i].processed);
            //console.log(this.polygons[i]);
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
                //console.log("   halfedge ", j);
                let hedge = cell.halfedges[j];
                let  currentRight = this.getRight(hedge);
                let {rigthSite, rightVertex} = this.getRight(hedge);

                // Procesamiento de edges
                
                // SI ya fue inicializado
                if (currentRight.rigthSite != null &&  
                    this.polygons[currentRight.rigthSite.voronoiId].processed) 
                {
                    //console.log("   cell inited");
                    let op_edges = this.polygons[currentRight.rigthSite.voronoiId].borders;
                    //console.log(op_edges);
                    // Recorrer los halfedges del poligono opuesto y encontrar el halfedge opuesto:
                    for (let k = 0; k < op_edges.length; k++) {
                        if (op_edges[k].d1 == this.polygons[i] || op_edges[k].d0 == this.polygons[i]){
                            // Añadir el Edge encontrado
                            edges.push(op_edges[k]);
                            //console.log("----> Edge Founded");
                        }
                    }
                    centers.push(this.polygons[currentRight.rigthSite.voronoiId])
                    edgesReady.push(true);
                }
                
                // SI NO fue inicializado
                else {
                    let edge = new MapEdge(); // Se crea un nuevo Edge
                    edge.d0 = this.polygons[i];  // Se conectan d0 y d1 al Edge
                    if (currentRight.rigthSite != null) {
                        edge.d1 = this.polygons[currentRight.rigthSite.voronoiId];
                        centers.push(this.polygons[currentRight.rigthSite.voronoiId]); // Se conectan un neighbor al center actual
                    }
                    edges.push(edge); // Añadir el Edge creado
                    this.edges.push(edge); // Se añade el Edge creado al arreglo genera
                    edgesReady.push(false); // Se añade el Edge creado al arreglo general
                }
                // -------------------------->
                // Procesamiento de corners

                // Se revisa si el poligono actual del corner ya se proceso (v1)
                if (currentRight.rigthSite != null &&  
                    this.polygons[currentRight.rigthSite.voronoiId].processed) 
                {   
                    //console.log(this.polygons[i]);
                    //console.log("console", cell);
                    //console.log(j, corners);
                    let op_edges = this.polygons[currentRight.rigthSite.voronoiId].borders;
                    for (let k = 0; k < op_edges.length; k++) {
                        if (op_edges[k].d1 == this.polygons[i] || op_edges[k].d0 == this.polygons[i]){
                            corners.push(op_edges[k].v1);
                            //console.log("AA");
                            
                            // Se revisa si el sgt corner le corresponde un center inicializado
                            let nextHedge = cell.halfedges[(j+1)%heLength];
                            let nRigth = this.getRight(nextHedge);
                            
                            if (nRigth.rigthSite != null &&  
                                !this.polygons[nRigth.rigthSite.voronoiId].processed) 
                            {
                                //console.log("AA", this.polygons[nRigth.rigthSite.voronoiId].processed);
                                corners.push(op_edges[k].v0);
                                prevReady = true;
                            } else {
                                prevReady = false;
                            }
                            cornersReady.push(2);
                            break;
                        }
                    }
                }
                // SI NO fue inicializado
                else if (!prevReady){
                    let corner = new MapCorner(); // Se crea un nuevo Corner
                    corner.setPosition(currentRight.rightVertex.x, currentRight.rightVertex.y); // Se setea la posicion al corner
                    corners.push(corner);
                    // Se añade el Edge creado al arreglo general
                    this.corners.push(corner); // Se añade el Edge creado al arreglo genera
                    cornersReady.push(0); // Se añade el Edge creado al arreglo general
                }
                else {
                    prevReady = false;
                    cornersReady.push(1);
                }

                // ----------------------------->
            }

            // Segunda pasada
            for (let j = 0; j < heLength; j++) {
                // Procesamiento de edges

                // SI el actual fue inicializado y el siguiente no
                if(!edgesReady[j]){
                    // SI NO fue inicializado

                    // Se añade al edge los corner v0 y v1
                    edges[j].v0 = corners[j];
                    edges[j].v1 = corners[(j+1) % heLength];

                }

                // -------------------------->
                // Procesamiento de corners
                
                let idxPrev = (j+ heLength-1)%heLength;
                // SI ya fue inicializado
                if (cornersReady[j] == 2) {
                    let tent_edge = edges[idxPrev];
                    let tent_corner = corners[idxPrev];
                    if (!(corners[j].protrodes.includes(tent_edge))){
                        corners[j].protrodes.push(tent_edge);
                    }
                    if (!(corners[j].adjent.includes(tent_corner))){
                        corners[j].adjent.push(tent_corner);
                    }
                    let nextIdx = (j+1)%heLength;
                    tent_edge = edges[j];
                    tent_corner = corners[nextIdx];
                    if (!(corners[j].protrodes.includes(tent_edge))){
                        corners[j].protrodes.push(tent_edge);
                    }
                    if (!(corners[j].adjent.includes(tent_corner))){
                        corners[j].adjent.push(tent_corner);
                    }
                }
                else if (cornersReady[j] == 0){
                    // SI NO fue inicializado
                    // Se conectan los tres centers a touches del corner actual
                    //console.log(j);
                    //console.log(corners);
                    //console.log("init", corners[j].touches.length, corners[j].protrodes.length, corners[j].adjent.length);
                    corners[j].touches.push(this.polygons[i]);
                    let hedge = cell.halfedges[j];
                    let currentRight = this.getRight(hedge);
                    if (currentRight.rigthSite != null) {
                        corners[j].touches.push(this.polygons[currentRight.rigthSite.voronoiId]);
                    }
                    let hedgePrev = cell.halfedges[idxPrev];
                    let prevRigth = this.getRight(hedgePrev);
                    //console.log(prevRigth.rigthSite);
                    if (prevRigth.rigthSite != null) {
                        corners[j].touches.push(this.polygons[prevRigth.rigthSite.voronoiId]);
                    }
                    // Se conecta el Edge posterior a protrodes del corner actual
                    corners[j].protrodes.push(edges[j]);
                    // Se conecta el Edge anterior a protrodes del corner actual
                    corners[j].protrodes.push(edges[idxPrev]);
                    // Se conecta el corner posterior a adjent del corner actual
                    corners[j].adjent.push(this.corners[(j+1)%heLength]);
                    // Se conecta el corner anterior a adjent del corner actual
                    corners[j].adjent.push(this.corners[idxPrev]);
                    //console.log(corners[j])
                    //console.log("end", corners[j].touches.length, corners[j].protrodes.length, corners[j].adjent.length);
                }
            }
            this.polygons[i].neighbors = centers;
            this.polygons[i].borders = edges;
            this.polygons[i].corners = corners;
            //console.log("End ");
            //console.log(this.polygons[i]);
            this.polygons[i].processed = true;

        }
    }

    searchCenterInBorder() {
        // Busca un nodo que sea oceano y que este en el borde
        let poly = null;
        for (let i = 0; i < this.polygons.length; i++){
            poly = this.polygons[i];
            if (poly.water) {
                for (let j = 0; j < poly.borders.length; j++) {
                    if (poly.borders[j].d0 == null || poly.borders[j].d1) {
                        return poly;
                    }
                }
            }
        }
        return null;
    }

    markCenters() {
        // Busca un nodo que sea oceano y que este en el borde
        let poly = this.searchCenterInBorder();

        // Se crea un stack y se añade el poligono inicial
        let stack = [];
        let explored = new Set();
        stack.push(poly);

        // Se marca el primer poligono como explorado y como oceano
        explored.add(poly);
        poly.ocean = true;
        
        // Se continua mientras el stack no este vacio
        while (stack.length > 0) {
            let center = stack.pop();

            center.neighbors
            .filter(n => (n.water && !explored.has(n)) )
            .forEach(n => {
                explored.add(n);
                stack.push(n);
                n.ocean = true;
            });
        }

        for (let i = 0; i < this.polygons.length; i++){
            let tmp_center = this.polygons[i];
            if (!tmp_center.water) {
                for (let j = 0; j < tmp_center.neighbors.length; j++) {
                    if (tmp_center.neighbors[j].ocean){
                        tmp_center.coast = true;
                        break;
                    }
                }
            }
        }
    }

    markCorners() {
        for (let i = 0; i < this.corners.length; i++){
            let ocean = true;  // indica si el corner esta rodeado de puros polygon ocean
            let aOcean = false; // indica si el corner esta rodeado de al menos 1 polygon ocean
            let aLand = false;  // indica si el corner esta rodeado de al menos 1 polygon land = !water
            let water = true;  // indica si el corner esta rodeado de puros polygon water

            let corner = this.corners[i];
            corner.ocean = false;
            corner.coast = false;
            corner.elevation = 0;
            corner.downSlope = null;
            corner.normal = {x: 0.0, y: 0.0, z: 1.0};

            for (let j = 0; j < corner.touches.length; j++) {
                if (corner.touches[j].ocean){
                    aOcean = true;
                } else {
                    ocean = false;
                }

                if (!corner.touches[j].water){
                    water = false;
                    aLand = true;
                } 
            }
            
            corner.ocean = ocean;
            corner.coast = aOcean && aLand;
            corner.water = water;
            //if (!corner.ocean) {
            //    corner.elevation = 3;
            //}
        }
    }

    getCoastCorners() {
        let coasts = [];
        for (let i = 0; i < this.corners.length; i++){
            if (this.corners[i].coast){
                coasts.push(this.corners[i]);  
            }
            if (!this.corners[i].ocean){

                this.corners[i].elevation = 10;
            }
            console.log(this.corners[i]); 
        } 
        return coasts;
    }

    getCoastCenters() {
        let centers = [];
        for (let i = 0; i < this.polygons.length; i++){
            if (this.polygons[i].coast){
                centers.push(this.polygons[i]);  
            }
            //console.log(this.corners[i]); 
            if (!this.polygons[i].ocean) {
                this.polygons[i].elevation = 10;
            }
        } 
        return centers;
    }


    setElevations2() {
        let queue = this.getCoastCorners();
        let explored = new Set();
        queue.forEach(n => {
            n.elevation = 0;
            explored.add(n);
        });

        while (queue.length > 0) {
            let corner = queue.shift();

            corner.adjent
            .filter(n => (!n.ocean && !explored.has(n)) )
            .forEach(n => {
                let newH = corner.elevation +1 *0.1;
                console.log(newH, n.elevation);
                if (newH <= n.elevation){
                    n.elevation = newH;
                    n.downSlope = corner;
                }
                explored.add(n);
                queue.push(n);
            });
        }
        for (let i = 0; i < this.polygons.length; i++){
            let poly = this.polygons[i];
            let polyLen = poly.corners.length;
            if (!poly.ocean && polyLen > 0){
                let sum = 0;
                for (let j = 0; j < polyLen; j++) {
                    sum += poly.corners[j].elevation;
                }
                poly.elevation = sum / polyLen;        
            }
        }

    }

    setElevations(increase) {
        let queue = this.getCoastCenters();
        let explored = new Set();
        queue.forEach(n => {
            n.elevation = 0;
            explored.add(n);
        });

        while (queue.length > 0) {
            let center = queue.shift();

            center.neighbors
            .filter(n => (!n.ocean && !explored.has(n)) )
            .forEach(n => {
                let newH;
                if (n.water){
                    newH = center.elevation;
                } else {
                    newH = center.elevation + (1 *increase);
                }
                //console.log(newH, n.elevation);
                if (newH <= n.elevation){
                    n.elevation = newH;
                    n.downSlope = center;
                }
                explored.add(n);
                queue.push(n);
            });
        }
        for (let i = 0; i < this.corners.length; i++){
            let corner = this.corners[i];
            let cornerLen = corner.touches.length;
            if (!corner.ocean && cornerLen > 0){
                let sum = 0;
                let sumVec = [0,0,0]
                for (let j = 0; j < cornerLen; j++) {
                    sum += corner.touches[j].elevation;
                    sumVec[0] += corner.touches[j].x;
                    sumVec[1] += corner.touches[j].y;
                    sumVec[2] += corner.touches[j].elevation;
                }
                corner.elevation = sum / cornerLen;     
                corner.normal = getNormalized(sumVec[0], sumVec[1], sumVec[2]);    
            }
        }
        for (let i = 0; i < this.polygons.length; i++) {
            let poly = this.polygons[i];
            let polyLen = poly.neighbors.length;
            if (!poly.ocean && polyLen > 0){
                let sum = [0,0,0];
                for (let j = 0; j < polyLen; j++) {
                    sum[0] += poly.neighbors[j].x;
                    sum[1] += poly.neighbors[j].y;
                    sum[2] += poly.neighbors[j].elevation;
                }
                poly.normal = getNormalized(sum[0], sum[1], sum[2]);
                if (poly.elevation > this.maxHeight){
                    this.maxHeight = poly.elevation;
                }        
            }
        }

    }
}

function getNormalized(x, y, z) {
    let mag = Math.sqrt(x*x + y*y + z*z);
    return {
        x: x/mag,
        y: y/mag,
        z: z/mag};
}