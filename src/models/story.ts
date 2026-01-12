import { MatterController } from "@/tamagotchi/controller"
import IdentityStore from "@/stores/identity"
import ActionStore from "@/stores/action"
import StoryStore from "@/stores/story"

class Story {
    type = undefined as "conditional" | "action" | "passive"
    controller: MatterController
    identityStore: ReturnType<typeof IdentityStore>
    actionStore: ReturnType<typeof ActionStore>
    storyStore: ReturnType<typeof StoryStore>
    cooldown: number // in hours
    score: number = 0 // Number between 0 and 10, higher score equals higher priority
    
    isDestroyed: boolean = false
    isAvailable: boolean = true

    constructor(controller: MatterController) {
        this.controller = controller
        this.identityStore = IdentityStore()
        this.actionStore = ActionStore()
        this.storyStore = StoryStore()

        this.checkIfAvailable()

        setTimeout(() => {
            this.start()
            this.#loop()
        })
    }

    #loop() {
        if (this.isDestroyed) {
            return
        }

        this.loop()
        requestAnimationFrame(() => {
            this.#loop()
        })
    }

    loop() {
    }

    checkIfAvailable() {
    }

    start() {

    }

    destroy() {
        this.isDestroyed = true
    }
}

export default Story