import { defineStore } from "pinia"
import { iconsMap } from "jao-icons"
import { type IDBPDatabase } from "idb"
import type { DBIdentity } from "@/stores/identity"
import useDatabaseStore from "@/stores/database"


export type actionTypes = "food" | "joy" | "love" | undefined
export type DBAction =  {
    id: number;                 
    created: number;            // timestamp
    wurmpjeId: number;          // id of the wurmpje
    quantity: number;           // amount of food
    action: actionTypes;        // type of action
}


const Action = defineStore("action", {
    state: () => ({
        db: undefined as IDBPDatabase | undefined,
        initialised: undefined as Promise<boolean> | undefined,
        isInitializing: false,

    }),
    actions: {
        init() {
            return this.initialised = new Promise(async (resolve, reject) => {
                if (this.isInitializing) {
                    return
                }
                this.isInitializing = true

                const databaseStore = useDatabaseStore()
                this.db = await databaseStore.init()
                
                console.log("Action database initialized")
                
                resolve(true)
            })
        },
        async add(wurmpjeId: number, action: actionTypes, quantity: number) {
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
                quantity,
            }
            store.add(dbAction)

            // Update wurmpje based on action
            if (action === "food") {
                if (typeof wurmpje.hunger !== "number") {
                    wurmpje.hunger = 80
                }
                wurmpje.hunger += quantity
            } else if (action === "joy") {
                if (typeof wurmpje.joy !== "number") {
                    wurmpje.joy = 80
                }
                wurmpje.joy += quantity
            } else if (action === "love") {
                if (typeof wurmpje.love !== "number") {
                    wurmpje.love = 80
                }
                wurmpje.love += quantity
            }

            // Update new wurmpje state
            const identityTx = this.db.transaction("identities", "readwrite")
            const identityStore = identityTx.objectStore("identities")
            identityStore.put(wurmpje as DBIdentity)    
            
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
                const wurmpje = await index.getAll(IDBKeyRange.only(wurmpjeId))[0]
               
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
        }
    },
    getters: {
    }
})

export default Action