// stores/database.ts
import { defineStore } from "pinia"
import { openDB, type IDBPDatabase } from "idb"

export const database = defineStore("database", {
    state: () => ({
        db: null as IDBPDatabase | null,
        initPromise: null as Promise<IDBPDatabase> | null,
    }),

    actions: {
        async init() {
            // al klaar
            if (this.db) return this.db

            // al bezig
            if (this.initPromise) return this.initPromise

            const DBNAME = import.meta.env.VITE_DBNAME || "wurmpje"
            const DBVERSION = Number(import.meta.env.VITE_DBVERSION) || 1

            this.initPromise = openDB(DBNAME, DBVERSION, {
                upgrade(db) {

                    // Identities store
                    if (!db.objectStoreNames.contains("identities")) {
                        const identityStore = db.createObjectStore("identities", {
                            keyPath: "id",
                        })
                        identityStore.createIndex("cooldown", "cooldown")
                        identityStore.createIndex("created", "created")
                        identityStore.createIndex("name", "name")
                    }

                    // Actions store
                    if (!db.objectStoreNames.contains("actions")) {
                        const actionStore = db.createObjectStore("actions", {
                            keyPath: "id",
                            autoIncrement: true,
                        })
                        actionStore.createIndex("wurmpjeId", "wurmpjeId")
                        actionStore.createIndex("quantity", "quantity")
                        actionStore.createIndex("action", "action")
                    }
                },
            })

            this.db = await this.initPromise
            return this.db
        },
    },
})

export default database