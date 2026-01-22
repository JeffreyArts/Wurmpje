import Matter from "matter-js"
import Story from "@/models/story"
import type Catterpillar from "../catterpillar"
import type BodyPart from "../catterpillar/bodypart"
import PlankModel from "@/models/plank"
import { type DBStory } from "@/stores/story"
import { collisionBodyPart, collisionWall } from "@/tamagotchi/collisions"

class PlankjeTestStory extends Story {
    type = "passive" as const
    catterpillar = undefined as Catterpillar | undefined
    plank = undefined as PlankModel | undefined
    disableDragging = false
    isGrabbed = false
    plankIsMovable = true
    xOffset = 0
    yOffset = 0
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

        const width = Math.floor(this.plank.width / 16) * 16
        if (pos.x > this.plank.x - width / 2 - 8 &&
            pos.x < this.plank.x + width / 2 + 8 &&
            pos.y > this.plank.y - this.plank.height / 2 &&
            pos.y < this.plank.y + this.plank.height / 2
        ) {
            this.isGrabbed = true
            this.xOffset = this.plank.x - pos.x
            this.yOffset = this.plank.y - pos.y
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
        const x = pos.x + this.xOffset
        const y = Math.min(pos.y + this.yOffset, maxY)
        Matter.Body.setPosition(this.plank.body, Matter.Vector.create(x, y))
         
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
        if (this.catterpillar) {
            this.catterpillar.bodyParts.forEach(this.preventGettingStuck.bind(this))
        }
    }
    
    preventGettingStuck(bodyPart: BodyPart) {
        if (!this.plank) {
            return
        }

        if (bodyPart && this.plank) {
            // Check if bodyPart is within plank width
            const halfPlankWidth = this.plank.width / 2 - 8
            if (bodyPart.x + bodyPart.radius < this.plank.x - halfPlankWidth ||
                bodyPart.x - bodyPart.radius > this.plank.x + halfPlankWidth) {
                return
            }
            if (bodyPart.y - bodyPart.radius < this.plank.y + 8 && bodyPart.y + bodyPart.radius > this.plank.y - 6) {
                // Disable collisions temporarily
                bodyPart.body.collisionFilter.mask = 0
                this.plank.body.collisionFilter.mask = 0
                // Push bodyPart up slightly
                Matter.Body.setVelocity(bodyPart.body, Matter.Vector.create(bodyPart.body.velocity.x, -4))
            } else {
                // Set collisions back to normal
                bodyPart.body.collisionFilter.mask = collisionBodyPart.mask
                this.plank.body.collisionFilter.mask = collisionWall.mask
            }
        }
    }

    removePlank(plank: PlankModel) {
        if (!plank) {
            return
        }
        
        // Remove from draw controller
        this.controller.draw.removeObjectById(plank.body.id)
        
        // Remove from Matter world
        Matter.World.remove(this.controller.ref.world, plank.body)

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