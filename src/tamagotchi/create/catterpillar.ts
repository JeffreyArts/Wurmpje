import Matter from "matter-js"
import CatterpillarModel from "@/models/catterpillar/index"
import type { IdentityField } from "@/models/identity"

export class Catterpillar {
    ref: CatterpillarModel
    world: Matter.World
    identity: IdentityField

    constructor({ x, y, identity }: {
        x: number,
        y: number,
        identity: IdentityField,
    }, world: Matter.World) {
        this.world = world
        this.identity = identity


        const catterPillarOptions =  {
            id: identity.id.toString(),
            x: x,
            y: y,
            hasStroke: false,
            length: 6,
            thickness: 24,
        }

        // Set composite
        this.ref = new CatterpillarModel(catterPillarOptions, world)
    }
}