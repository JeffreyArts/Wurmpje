import Matter from "matter-js"
import Story from "@/models/story"
import type Catterpillar from "../catterpillar"
import PlankModel from "@/models/plank"
import { type DBStory } from "@/stores/story"

class PlankjeTestStory extends Story {
    type = "passive" as const
    catterpillar = undefined as Catterpillar | undefined
    plank = undefined as PlankModel | undefined
    disableDragging = false
    isGrabbed = false
    plankIsMovable = true
    xOffset = 0
    dbStory = undefined as DBStory | undefined
    
    async start() {
        console.info("Plankje test story started", this.identityStore)

        this.controller.ref.addpointerDownEvent(this.#grabPlank.bind(this), "grabPlank")
        this.controller.ref.addpointerUpEvent(this.#releasePlank.bind(this), "releasePlank")
        this.controller.ref.addpointerMoveEvent(this.#dragPlank.bind(this), "dragPlank")
        this.catterpillar = this.controller.catterpillar

        this.dbStory = await this.storyStore.getLatestDatabaseEntry("plankje-test")
        this.createPlank()

        this.controller.draw.addPlank(this.plank)

    }

    #grabPlank(pos) {
        if (!this.plankIsMovable) {
            return
        }

        this.isGrabbed = false

        if (pos.x > this.plank.x - this.plank.width / 2 - 40 &&
            pos.x < this.plank.x + this.plank.width / 2 + 40 &&
            pos.y > this.plank.y - this.plank.height / 2 - 40 &&
            pos.y < this.plank.y + this.plank.height / 2 + 40
        ) {
            this.isGrabbed = true
            this.xOffset = this.plank.x - pos.x
        }   
    }

    #releasePlank() {
        if (this.disableDragging) {
            return
        }

        // Release isGrabbed state
        this.isGrabbed = false
    }

    #dragPlank(pos) {
        if (this.disableDragging || !this.isGrabbed) {
            return
        }
        const maxY = this.controller.ref.renderer.canvas.clientHeight - this.controller.config.offsetBottom
        
        // Move plank
        Matter.Body.setPosition(this.plank.body, Matter.Vector.create(pos.x + this.xOffset, Math.min(pos.y, maxY)))
         
        // this.plank.x = pos.x
        // this.plank.y = Math.min(pos.y, maxY)
    }   

    async createPlank() {
        let width = Math.min(this.controller.ref.renderer.canvas.clientWidth / 3 * 2, 320)
        // Round to nearest 16 (downwards)
        width = Math.floor(width / 16) * 16

        // Determine y position for plank
        const y = this.controller.ref.renderer.canvas.clientHeight - this.controller.config.offsetBottom * 3
        const x = width/2
        
        this.plank = new PlankModel({
            x,
            y,
            width,
        }, this.controller.ref.world)

        return this.plank
    }

    loop() {
        
    }

    removePlank(plank: PlankModel) {
        if (!plank) {
            return
        }
        
        
        // Remove from draw controller
        this.controller.draw.removeObjectById(plank.composite.id)
        
        // Remove from Matter world
        Matter.World.remove(this.controller.ref.world, plank.composite)

        // Remove ball
        this.plank = undefined
    }

    
    destroy() {
        super.destroy()

        this.controller.ref.removepointerDownEvent("grabPlank")
        this.controller.ref.removepointerUpEvent("releasePlank")
        this.controller.ref.removepointerMoveEvent("dragPlank")
    }
}

export default PlankjeTestStory