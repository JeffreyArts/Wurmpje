import { MatterController } from "@/tamagotchi/controller"
import IdentityStore from "@/stores/identity"
import ActionStore from "@/stores/action"
import StoryStore from "@/stores/story"

class Story {
    controller: MatterController
    identityStore: ReturnType<typeof IdentityStore>
    actionStore: ReturnType<typeof ActionStore>
    storyStore: ReturnType<typeof StoryStore>
    cooldown: number // in hours
    score: number = 0 // Number between 0 and 10, higher score equals higher priority

    constructor(controller: MatterController) {
        this.controller = controller
        this.identityStore = IdentityStore()
        this.actionStore = ActionStore()
        this.storyStore = StoryStore()

        this.setScore()

        setTimeout(() => {
            this.start()
            this.#loop()
        })
    }

    #loop() {
        this.loop()
        requestAnimationFrame(() => {
            this.#loop()
        })
    }

    loop() {
    }

    setScore() {
        
    }

    start() {
    }
    destroy() {

    }
}

export default Story