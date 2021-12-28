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
                let {rigthSite, rightVertex} = this.getRight(hedge);

                // Procesamiento de edges
                
                // SI ya fue inicializado
                if (rigthSite != null &&  
                    this.polygons[rigthSite.voronoiId].processed) 
                {
                    //console.log("   cell inited");
                    let op_edges = this.polygons[rigthSite.voronoiId].borders;
                    //console.log(op_edges);
                    // Recorrer los halfedges del poligono opuesto y encontrar el halfedge opuesto:
                    for (let k = 0; k < op_edges.length; k++) {
                        if (op_edges[k].d1 == this.polygons[i] || op_edges[k].d0 == this.polygons[i]){
                            // Añadir el Edge encontrado
                            edges.push(op_edges[k]);
                            //console.log("----> Edge Founded");
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
                        //console.log("Here");
                        //console.log(this.polygons[i] );
                        //console.log(op_edges);
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
                    //console.log(j);
                    //console.log(heLength);
                    //console.log(corners);
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
        }
    }
}