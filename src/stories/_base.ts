import { MatterController } from "@/tamagotchi/controller"
import IdentityStore from "@/stores/identity"
import ActionStore from "@/stores/action"
import StoryStore from "@/stores/story"
import type Score from "@/models/score"

class Story {
    type = undefined as "conditional" | "action" | "passive"
    priority = "low" as "low" | "medium" | "high"
    controller: MatterController
    identityStore: ReturnType<typeof IdentityStore>
    actionStore: ReturnType<typeof ActionStore>
    storyStore: ReturnType<typeof StoryStore>
    cooldown: number // in hours
    score: Score

    isDestroyed: boolean = false
    isAvailable: boolean = true

    constructor(controller: MatterController, silent = false) {
        this.controller = controller
        this.identityStore = IdentityStore()
        this.actionStore = ActionStore()
        this.storyStore = StoryStore()

        // Silent is used to prevent the story from fully starting, but just initiate the stores & controller
        if (silent) {
            return
        }

        console.log("🦩 Initializing BASEstory:", this)
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

    async checkCondition() {
        return false
    }

    start() {

    }

    destroy() {
        this.isDestroyed = true
        this.controller = undefined
        this.identityStore = undefined
        this.actionStore = undefined
        this.storyStore = undefined
    }
}

export default Story