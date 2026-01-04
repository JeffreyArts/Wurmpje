import { defineStore } from "pinia"
import introStory from "@/models/stories/intro"
import { MatterController } from "@/tamagotchi/controller"

export type DBStory =  {
    id: number;
    wurmpjeId: number;
    name: string;
    details: { [key: string]: string | number | boolean | object | undefined | Array< string | number | boolean | object | undefined > };
}

const story = defineStore("story", {
    state: () => ({
        all: [],
        controller: undefined as MatterController | undefined,
        activeStories: [],
        availableStories: [],
        initialised: undefined as Promise<boolean> | undefined,
        isInitializing: false,

    }),
    actions: {
        init() {
            return this.initialised = new Promise(async (resolve) => {
                if (this.isInitializing) {
                    return
                }
                this.isInitializing = true

                this.addStory("intro", introStory)

                resolve(true)
            })
        },
        addStory(name, storyInstance) {
            this.all.push({ name, instance: storyInstance })
        },
        setController(controller: MatterController) {
            this.controller = controller
        },
        setActiveStory(name: string) {
            const story = this.all.find(s => s.name === name)
            if (!story) {
                throw new Error(`Story with name ${name} not found`)
            }
            this.activeStories.push(new story.instance(this.controller))
        }
    },
    getters: {
    }
})

export default story