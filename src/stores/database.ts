// stores/database.ts
import { defineStore } from "pinia"
import { openDB, type IDBPDatabase, type IDBPTransaction } from "idb"

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

            const self = this
            this.initPromise = openDB(DBNAME, DBVERSION, {
                upgrade(db, oldVersion, newVersion, transaction) {
                    // Identities store
                    self.createStore(db, transaction, "identities", { keyPath: "id" }, [
                        "id",
                        "cooldown",
                        "created",
                        "name",
                    ])

                    // Actions store
                    self.createStore(db, transaction, "actions", { keyPath: "id", autoIncrement: true }, [
                        "wurmpjeId",
                        "value",
                        "action",
                    ])
                },
            })

            this.db = await this.initPromise
            return this.db
        },
        createStore(db: IDBPDatabase, transaction: IDBPTransaction, storeName: string, options: IDBObjectStoreParameters, indexes: Array<string>) {
            let store
            if (!db.objectStoreNames.contains(storeName)) {
                store = db.createObjectStore(storeName, options)
            } else {
                store = transaction.objectStore(storeName)
            }

            indexes.forEach((indexName) => {
                if (!store.indexNames.contains(indexName)) {
                    store.createIndex(indexName, indexName)
                }
            })
        }
    },
})

export default database