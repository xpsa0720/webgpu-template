import type { Primitive } from "./primitive";

export class Geometry{
    primitives: Primitive[];
    indexs : number[];
    
    constructor(primitives?: Primitive[],indexs?: number[]){
        this.primitives = primitives??[]
        this.indexs = indexs??[]
    }
}