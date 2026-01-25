import Matter from "matter-js"
import Story from "@/stories/_base"
import Catterpillar, { type Emote } from "@/models/catterpillar"
import type { currentIdentity } from "@/stores/identity"

class WallSlamStory extends Story {
    type = "passive" as const
    identity = undefined as currentIdentity | undefined
    catterpillar = undefined as Catterpillar | undefined
    defaultState = "happy" as Emote
    defaultStateTimeout = undefined as ReturnType<typeof setTimeout> | undefined
    isHurt = false
    isDestroyed = false
    
    start() {
        console.info("🦩 Wall Slam story started")
        
        this.identity = this.identityStore.current
        this.defaultState = this.controller.catterpillar.defaultState
        
        setTimeout(() => {
            Matter.Events.on(this.controller.ref.engine, "collisionStart",this.#collisionEventListener)
        })
    }

    loop() {
        if (this.isDestroyed) {
            return
        }
        this.catterpillar = this.controller.catterpillar
    }
    
    #collisionEventListener() {
        this.#checkForCollion.bind(this)
    }
    
    #checkForCollion(event: Matter.IEventCollision<Matter.Engine>) { 
        event.pairs.forEach((pair) => {
            // Check of dit pair je head bevat
            const head = this.catterpillar.head.body
            if (pair.bodyA.label === head.label || pair.bodyB.label === head.label) {

                // Bepaal welke body de head is en welke de ander
                const other = (pair.bodyA.label === head.label) ? pair.bodyB : pair.bodyA
                const normal = pair.collision.normal

                // Relatieve snelheid langs normaal
                const relVel = {
                    x: other.velocity.x - head.velocity.x,
                    y: other.velocity.y - head.velocity.y
                }
                const vRelAlongNormal = relVel.x * normal.x + relVel.y * normal.y

                const impactScore = Math.abs(vRelAlongNormal)

                if (impactScore > 24) {
                    this.actionStore.add(this.identity.id, "love", -2)
                    this.identityStore.current.love -= 2
                    this.catterpillar.defaultState = "sad"
                    this.isHurt = true
                 
                    if (this.defaultStateTimeout) {
                        clearTimeout(this.defaultStateTimeout)
                    }
                 
                    this.defaultStateTimeout = setTimeout(() => {
                        this.identityStore.setDefaultEmotionalState()
                        this.catterpillar.defaultState = this.identityStore.current.defaultState as Emote
                        this.catterpillar.emote(this.catterpillar.defaultState)
                        this.isHurt = false
                    }, 10000)
                }
            }
        })
    }

    destroy = () => {
        console.info("📕 Wall Slam story finished")

        this.isDestroyed = true
        this.identity = undefined
        Matter.Events.off(this.controller.ref.engine, "collisionStart",this.#collisionEventListener)

        // Process the default story destroy
        super.destroy()
    }
}

export default WallSlamStory