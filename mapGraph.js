
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
            let tmp_site = this.diagram.cells[i].sites;
            let center = new MapCenter();
            center.setPosition(tmp_site.x, tmp_site.y);
            centers.push(center);
        }
        this.polygons = centers;
    }

    build() {
        this.buildCenters();
        // Se recorren todas las celdas
        for (let i = 0; i < this.diagram.cells.length; i++) {
            let cell = this.diagram.cells[i];
            // Se recorren los halfedges de la celda
            let heLength = cell.halfedges.length;
                centers = [],
                corners = [],
                edges = [],
                edgesReady = [],
                cornersReady = [],
                prevReady = false;

            // Primera pasada
            for (let j = 0; j < heLength; j++) {
                let hedge = cell.halfedges[j];
                let tmp_edge = hedge.edge;

                // Procesamiento de edges
                
                // SI ya fue inicializado
                if (tmp_edge.rSite != null &&  
                    this.polygons[tmp_edge.rSite.voronoiId].processed) 
                {   
                    let op_edges = this.polygons[tmp_edge.rSite.voronoiId].borders;
                    // Recorrer los halfedges del poligono opuesto y encontrar el halfedge opuesto:
                    for (let k = 0; k < op_edges; k++) {
                        if (op_edges[k].d1 == this.polygons[i]){
                            // Añadir el Edge encontrado
                            edges.push(op_edges[k]);
                        }
                    }
                    edgesReady.push(true);
                }
                
                // SI NO fue inicializado
                if (!this.polygons[tmp_edge.rSite.voronoiId].processed){
                    let edge = new MapEdge(); // Se crea un nuevo Edge
                    edge.d0 = this.polygons[i];  // Se conectan d0 y d1 al Edge
                    if (tmp_edge.rSite != null) {
                        edge.d1 = this.polygons[tmp_edge.rSite.voronoiId];
                        centers.push(this.polygons[tmp_edge.rSite.voronoiId]); // Se conectan un neighbor al center actual
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
                    if (tmp_edge.rSite != null &&  
                        this.polygons[tmp_edge.rSite.voronoiId].processed) 
                    {   
                        let op_edges = this.polygons[tmp_edge.rSite.voronoiId].borders;
                        // Recorrer los halfedges del poligono opuesto y encontrar el halfedge opuesto:
                        for (let k = 0; k < op_edges; k++) {
                            if (op_edges[k].d1 == this.polygons[i]){
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
                    if (!this.polygons[tmp_edge.rSite.voronoiId].processed){
                        let corner = new MapCorner(); // Se crea un nuevo Corner
                        corner.setPosition(tmp_edge.va.x, tmp_edge.va.y); // Se setea la posicion al corner
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
                    corners[j].touches.push(this.polygons[i]);
                    let hedge = cell.halfedges[j];
                    let tmp_edge = hedge.edge;
                    if (tmp_edge.rSite != null) {
                        corners[j].touches.push(this.polygons[tmp_edge.rSite.voronoiId]);
                    }
                    let idxPrev = (j+ heLength-1)%heLength;
                    let hedgePrev = cell.halfedges[idxPrev];
                    let tmp_edgePrev = hedgePrev.edge;
                    if (tmp_edgePrev.rSite != null) {
                        corners[j].touches.push(this.polygons[tmp_edgePrev.rSite.voronoiId]);
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

        }
    }
}