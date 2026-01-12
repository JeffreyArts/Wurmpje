import { defineStore } from "pinia"
import { MatterController } from "@/tamagotchi/controller"
import { type IDBPDatabase } from "idb"

import type Story from "@/models/story"
import introStory from "@/models/stories/intro"
import eatStory from "@/models/stories/eat"
import wofStory from "@/models/stories/word-of-affirmation"
import pettingStory from "@/models/stories/petting"
import wallSlamStory from "@/models/stories/wall-slam"
import ballStory from "@/models/stories/ball"

import { type IdentityField } from "@/models/identity"
import useDatabaseStore from "@/stores/database"


export type DBStory =  {
    id: number;
    wurmpjeId: number;
    name: string;
    created: number; // timestamp
    cooldown: number | undefined; // in hours
    details: { [key: string]: string | number | boolean | object | undefined | Array< string | number | boolean | object | undefined > };
}

export type activeStory = {
    id: number;
    name: string;
    wurmpjeId: number;
    instance: Story | InstanceType<typeof Story>;
    created: number; // timestamp
    cooldown: number | undefined; // in hours
    details: { [key: string]: string | number | boolean | object | undefined | Array< string | number | boolean | object | undefined > };
}

const story = defineStore("story", {
    state: () => ({
        all: [],
        controller: undefined as MatterController | undefined,
        identity: undefined as IdentityField | undefined,
        activeStories: [] as activeStory[],
        availableStories: [],
        db: undefined as IDBPDatabase | undefined,
        initialised: undefined as Promise<boolean> | undefined,
        isInitializing: false,
        conditionalStories: [] as Array<{ name: string, instance: typeof Story, priority: "low" | "medium" | "high" }>,

    }),
    actions: {
        init() {
            return this.initialised = new Promise(async (resolve) => {
                if (this.isInitializing) {
                    return
                }
                this.isInitializing = true
                const databaseStore = useDatabaseStore()
                this.db = await databaseStore.init()

                // Conditional stories
                this.addStory("intro", introStory)
                this.addStory("ball", ballStory) 

                // Action related stories
                this.addStory("eat", eatStory)
                this.addStory("wof", wofStory)
                
                // Passive stories, always active
                this.addStory("wall-slam", wallSlamStory) 
                this.addStory("petting", pettingStory) 

                // Info
                console.info("Story database initialized")
                resolve(true)
            })
        },
        addStory(name, storyInstance) {
            this.all.push({ name, instance: storyInstance })
        },
        async updateConditionalStories() {
            this.conditionalStories = []
            const promises = [] as Array<() => Promise<void>>
            this.all.forEach(async story => {
                promises.push(async () => {
                    if (!this.controller) {
                        return
                    }
                    const tempInstance = new story.instance(this.controller, true)
                    if (tempInstance.type === "conditional") {
                        const conditionMet = await tempInstance.checkCondition()
                        if (conditionMet) {
                            this.conditionalStories.push({ name: story.name, instance: story.instance, priority: tempInstance.priority  })
                        }
                    }
                    tempInstance.destroy()
                })
            })

            await Promise.all(promises.map(p => p()))

            // Sort this.conditionalStories by priority high to low
            this.conditionalStories.sort((a, b) => {
                const priorityMap = { "high": 3, "medium": 2, "low": 1 }
                const aPriority = priorityMap[a.priority] || 1
                const bPriority = priorityMap[b.priority] || 1
                return bPriority - aPriority
            })

            console.warn("Updated conditional stories:", this.conditionalStories)
        },
        async getLatestDatabaseEntry(name: string) {
            const wurmpjeId = this.identity?.id

            if (!this.db) {
                throw new Error("Database not initialized")
            }
            if (!wurmpjeId) {
                throw new Error("No wurmpjeId set in identity store")
            }
            
            const tx = this.db.transaction("stories", "readonly")
            const store = tx.objectStore("stories")
            const index = store.index("wurmpjeId")
            const stories = await index.getAll(IDBKeyRange.only(wurmpjeId))
            const storyDB = stories.find(s => s.name === name)
            await tx.done

            return storyDB
        },


        setController(controller: MatterController) {
            this.controller = controller
        },
        setIdentity(identity: IdentityField) {
            this.identity = identity
        },
        async setActiveStory(name: string) {
            const story = this.all.find(s => s.name === name)
            const wurmpjeId = this.identity?.id
            let skip = false

            if (!story) {
                throw new Error(`Story with name ${name} not found`)
            }

            if (!this.db) {
                throw new Error("Database not initialized")
            }
            
            if (!wurmpjeId) {
                throw new Error("No wurmpjeId set in identity store")
            }

            // Load story details from dbs (based on wurmpjeId and name)
            const tx = this.db.transaction("stories", "readwrite")
            const store = tx.objectStore("stories")
            const index = store.index("wurmpjeId")
            const stories = await index.getAll(IDBKeyRange.only(wurmpjeId))
            let storyDB = stories.find(s => {
                if (s.name === name) {
                    const cooldownDate = new Date(s.created + s.cooldown)
                    const now = new Date()
                    if (now < cooldownDate) {
                        console.warn(`Story ${name} is on cooldown until ${cooldownDate.toISOString()}`)
                        skip = true
                        return null
                    }
                    return s
                }
                return null
            })

            if (skip) {
                return null
            }
            
            if (!storyDB) { 
                // Add new story to db
                storyDB = {
                    wurmpjeId,
                    created: Date.now(),
                    cooldown: undefined,
                    name,
                    details: {},
                }
                store.add(storyDB)
                await tx.done
            } 

            // First add object to activeStories array, so the instance has access to it during construction 
            const newStory = {
                id: storyDB.id,
                created: storyDB.created,
                cooldown: storyDB.cooldown,
                name: storyDB.name,
                wurmpjeId: storyDB.wurmpjeId,
                details: storyDB.details,
            } as activeStory
            this.activeStories.push(newStory)
            newStory.instance = new story.instance(this.controller)
            
            
            return newStory

        },
        getActiveStory(name: string) {
            const wurmpjeId = this.identity?.id

            if (!wurmpjeId) {
                throw new Error("No wurmpjeId set in identity store")
            }

            return this.activeStories.find(s => s.name === name && s.wurmpjeId === wurmpjeId)
        },
        removeActiveStory(name: string) {
            let wurmpjeId = this.identity?.id

            if (!wurmpjeId) {
                throw new Error("No wurmpjeId set in identity store")
            }

            let activeStory = this.activeStories.find(s => s.name === name && s.wurmpjeId === wurmpjeId)
            // If not found, try with wurmpjeId 1 (default)
            if (!activeStory) { wurmpjeId = 1 }
            activeStory = this.activeStories.find(s => s.name === name && s.wurmpjeId === wurmpjeId)
            console.log("Removing active story:", name, wurmpjeId, activeStory, this.activeStories)
            if (activeStory) {
                activeStory.instance.destroy()
                this.activeStories = this.activeStories.filter(s => s.name !== name || s.wurmpjeId !== wurmpjeId)
            }
        },
        updateStoryDetails(name: string, details: { [key: string]: string | number | boolean | object | undefined | Array< string | number | boolean | object | undefined > }) {
            const wurmpjeId = this.identity?.id

            if (!this.db) {
                throw new Error("Database not initialized")
            }

            if (!wurmpjeId) {
                throw new Error("No wurmpjeId set in identity store")
            }
            
            const tx = this.db.transaction("stories", "readwrite")
            const store = tx.objectStore("stories")
            const index = store.index("wurmpjeId")
            index.getAll(IDBKeyRange.only(wurmpjeId)).then((stories) => {
                const storyDB = stories.find(s => s.name === name)
                if (storyDB) {
                    storyDB.details = details
                    store.put(storyDB)
                }
            })
            return tx.done
        },

        // updateStoryCooldown(name: string) {
        //     const wurmpjeId = this.identity?.id

        //     if (!this.db) {
        //         throw new Error("Database not initialized")
        //     }

        //     if (!wurmpjeId) {
        //         throw new Error("No wurmpjeId set in identity store")
        //     }
        //     const activeStory = this.getActiveStory(name)
            
        //     const tx = this.db.transaction("stories", "readwrite")
        //     const store = tx.objectStore("stories")
        //     const index = store.index("wurmpjeId")
        //     index.getAll(IDBKeyRange.only(wurmpjeId)).then((stories) => {
        //         const storyDB = stories.find(s => s.name === name)
        //         if (storyDB) {
        //             storyDB.cooldown = activeStory.instance.cooldown
        //             store.put(storyDB)
        //         }
        //     })
        //     return tx.done
        // },

        // Used to mark story as completed and set cooldown
        completeStory(name: string) {
            const wurmpjeId = this.identity?.id
            const activeStory = this.getActiveStory(name)
            if (!activeStory) {
                return
            }

            if (!wurmpjeId) {
                console.warn("No wurmpjeId set in identity store for completing story")
                return
            }

            const tx = this.db.transaction("stories", "readwrite")
            const store = tx.objectStore("stories")
            const index = store.index("wurmpjeId")
            index.getAll(IDBKeyRange.only(wurmpjeId)).then((stories) => {
                const storyDB = stories.find(s => s.name === name)
                if (storyDB) {
                    storyDB.cooldown = activeStory.instance.cooldown
                    store.put(storyDB)
                }
            })
            
            this.killStory(name)
            
            return tx.done
        },
         
        // Used for stories that can be told multiple times (no cooldown)
        killStory(name: string) {
            this.removeActiveStory(name)
        },   
    },
    getters: {
    }
})

export default story