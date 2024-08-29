export class System {
    constructor(ecs) {
        this.priority = 1;
        this.dirtyComponents = new Set();
        this.id = System.count++;
        this.ecs = ecs;
    }
}
System.count = 0;
