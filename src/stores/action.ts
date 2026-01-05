import { defineStore } from "pinia"
import { iconsMap } from "jao-icons"
import { type IDBPDatabase } from "idb"
import type { DBIdentity } from "@/stores/identity"
import useStoryStore from "@/stores/story"
import useDatabaseStore from "@/stores/database"

export type actionTypes = "food" | "joy" | "love" | "hungerLoss" | undefined
export type DBAction =  {
    id: number;                 
    created: number;            // timestamp
    wurmpjeId: number;          // id of the wurmpje
    value: number;           // amount of food
    action: actionTypes;        // type of action
}


const Action = defineStore("action", {
    state: () => ({
        db: undefined as IDBPDatabase | undefined,
        initialised: undefined as Promise<boolean> | undefined,
        isInitializing: false,
        availableFood: 3,
        isSelected: false,
        storyStore: undefined as ReturnType<typeof useStoryStore> | undefined,
        activeAction: "food" as actionTypes | "",
    }),
    actions: {
        init() {
            return this.initialised = new Promise(async (resolve) => {
                if (this.isInitializing) {
                    return
                }
                this.isInitializing = true

                this.storyStore = useStoryStore()
                const databaseStore = useDatabaseStore()
                this.db = await databaseStore.init()
                
                // Load
                console.info("Action database initialized")

                resolve(true)
            })
        },
        async add(wurmpjeId: number, action: actionTypes, value: number) {
            if (!this.db) {
                throw new Error("Database not initialized")
            }

            const wurmpje = await this.loadWurmpjeById(wurmpjeId)

            if (!wurmpje) {
                throw new Error("Wurmpje not found")
            }

            // Add action to db
            const tx = this.db.transaction("actions", "readwrite")
            const store = tx.objectStore("actions")
            const timestamp = Date.now()
            const dbAction = {
                created: timestamp,
                wurmpjeId,
                action,
                value,
            }
            store.add(dbAction)

            // Update wurmpje based on action
            if (action === "food") {
                if (typeof wurmpje.hunger !== "number") {
                    wurmpje.hunger = 80
                }
                wurmpje.hunger += value
            } else if (action === "joy") {
                if (typeof wurmpje.joy !== "number") {
                    wurmpje.joy = 80
                }
                wurmpje.joy += value
            } else if (action === "love") {
                if (typeof wurmpje.love !== "number") {
                    wurmpje.love = 80
                }
                wurmpje.love += value
            }

            // Update new wurmpje state
            const identityTx = this.db.transaction("identities", "readwrite")
            const identityStore = identityTx.objectStore("identities")
            identityStore.put(wurmpje as DBIdentity)    
            

            if (action === "food") {
                await this.loadAvailableFood(wurmpje)
            }
            
            return tx.done
        },
        loadWurmpjeById(wurmpjeId: number): Promise<DBIdentity> {
            return new Promise(async (resolve, reject) => {
                if (!this.db) {
                    return reject("Database not initialized")
                }

                // Load wurmpje from db
                const tx = this.db.transaction("identities", "readonly")
                const store = tx.objectStore("identities")
                const index = store.index("id")
                const wurmpjes = await index.getAll(IDBKeyRange.only(wurmpjeId))
                const wurmpje = wurmpjes[0]

                if (!wurmpje) {
                    reject(new Error("Wurmpje not found"))
                }
                resolve(wurmpje)
            })
        },
        svgIcon(typeOfAction: actionTypes, asString: boolean) {
            let iconName = ""
            if (typeOfAction === "food") { 
                iconName = "leaf"
            } else if (typeOfAction === "joy") {
                iconName = "smile"
            } else if (typeOfAction === "love") {
                iconName = "heart"
            }

            if (!iconName) {
                return null
            }

            const json = iconsMap["large"][iconName]
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
            svg.setAttribute("viewBox", `0 0 ${json[0].length * 9} ${json.length * 9}`)
            for (const y of json) {
                for (const x of y) {
                    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
                    rect.setAttribute("x", (x * 9).toString())
                    rect.setAttribute("y", (y * 9).toString())
                    rect.setAttribute("width", "8")
                    rect.setAttribute("height", "8")
                    rect.setAttribute("fill", x[2])
                    svg.appendChild(rect)
                }
            }

            if (asString) {
                const container = document.createElement("div")
                container.appendChild(svg)
                return container.innerHTML
            }

            return svg
        },
        loadLastActionsFromDB(wurmpjeId: number, typeOfAction: actionTypes, value: number ): Promise<DBAction> {
            return new Promise(async (resolve, reject) => {
                if (!this.db) {
                    return reject("Database not initialized")
                }

                const tx = this.db.transaction("actions", "readonly")
                const store = tx.objectStore("actions")
                const index = store.index("wurmpjeId")
                // Load last actions for wurmpje
                const allActions = await index.getAll()
                const filteredActions = allActions.filter(action => action.wurmpjeId === wurmpjeId && action.action === typeOfAction)
                // Sort by created date descending
                filteredActions.sort((a, b) => b.created - a.created)
                // Get the last 'value' actions
                const actions = filteredActions.slice(0, value)

                resolve(actions as unknown as DBAction)
            })
        },
        async loadAvailableFood(wurmpjeId: number) {
            const maxFood = 3
            let availableFood = maxFood
            const lastFoodMoments = await this.loadLastActionsFromDB(wurmpjeId, "food", maxFood)
            for (const foodMoment in lastFoodMoments) {
                // Get difference in hours between now and created
                const now = Date.now()
                const created = lastFoodMoments[foodMoment].created
                const diffInHours = (now - created) / (1000 * 60 * 60)

                // For each 8 hours passed, add 1 food back
                if (diffInHours < 8) {
                    availableFood --
                }
            }

            this.availableFood = availableFood
        },
        async procesStartingHunger(wurmpjeId: number) {
            let amountOfHoursWithoutFood = 0

            const lastActions = await this.loadLastActionsFromDB(wurmpjeId, "hungerLoss", 1)
            const lastAction = lastActions[0]
            const wurmpje = await this.loadWurmpjeById(wurmpjeId)

            if (!wurmpje) {
                console.error(new Error("Wurmpje not found"))
            }
            
            if (lastAction && lastAction.created) {
                const now = Date.now()
                const created = lastAction.created
                amountOfHoursWithoutFood = (now - created) / (1000 * 60 * 60)
            }
            
            const hungerSubtraction = Math.round(amountOfHoursWithoutFood * .75)
            wurmpje.hunger -= hungerSubtraction
            
            // No need to add action if no hunger was lost
            if (hungerSubtraction == 0) {
                return
            }

            if (this.db) {
                // Update new wurmpje state
                const identityTx = this.db.transaction("identities", "readwrite")
                const identityStore = identityTx.objectStore("identities")
                identityStore.put(wurmpje as DBIdentity)    

                // Add new hungerLoss action to db
                const actionTx = this.db.transaction("actions", "readwrite")
                const actionStore = actionTx.objectStore("actions")
                const timestamp = Date.now()
                const dbAction = {
                    created: timestamp,
                    wurmpjeId,
                    action: "hungerLoss" as actionTypes,
                    value: hungerSubtraction,
                }
                actionStore.add(dbAction)

                await identityTx.done
                await actionTx.done
            }
            
        },
        toggleSelected() {
            this.isSelected = !this.isSelected

            // Start eat story when food action is selected
            if (this.isSelected && this.activeAction === "food") {
                if (!this.storyStore.getActiveStory("eat") ) {
                    this.storyStore.setActiveStory("eat")
                }
            }
        }
    },
    getters: {
    }
})

export default Action