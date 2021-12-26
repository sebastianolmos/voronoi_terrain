import {Voronoi} from './rhill-voronoi-core.js'

export class VoronoiGenerator {
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