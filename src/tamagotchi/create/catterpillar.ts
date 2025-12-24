import Matter from "matter-js"
import CatterpillarModel from "@/models/catterpillar/index"
import type { IdentityField } from "@/models/identity"

import Textures from "@/assets/default-textures"
import ColorSchemes, { type ColorScheme } from "@/assets/default-color-schemes"

export class Catterpillar {
    ref: CatterpillarModel
    world: Matter.World
    identity: IdentityField
    texture: { top?: string, bottom?: string, vert?: string, "360"?: string, stroke?: boolean, disabled?: boolean }
    colorScheme: ColorScheme


    constructor({ x, y, identity }: {
        x: number,
        y: number,
        identity: IdentityField
    }, world: Matter.World) {
        this.world = world
        this.identity = identity
        

        this.processIdentity(identity)
    
        const catterPillarOptions =  {
            id: identity.id.toString(),
            x: x,
            y: y,
            length: identity.length,
            thickness: identity.thickness,
            primaryColor: this.colorScheme.colors[0],
            secondaryColor: this.colorScheme.colors[1],
            offset: identity.offset,
            texture: this.texture,
        }

        // Set composite
        this.ref = new CatterpillarModel(catterPillarOptions, world)
    }

    processIdentity(identity: IdentityField): void {
        this.texture = Textures[identity.textureIndex ]
        this.colorScheme = ColorSchemes[identity.colorSchemeIndex]
        // const textureDirs: Array<string> = []
        // for (const key in this.texture) {
        //     if (key == "stroke" && key !== "disabled" && this.texture[key]) {
        //         textureDirs.push(`/bodyparts/${key}/${this.texture[key]}`)
        //     }
        // }
    }   
}