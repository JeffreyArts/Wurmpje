import { defineStore } from "pinia"
import ColorScheme from "@/assets/default-color-schemes"
import Identity, { type IdentityField } from "@/models/identity"
import Textures, { type textureInterface } from "@/assets/default-textures"
import { openDB, type IDBPDatabase } from "idb"

const DBNAME = "wurmpje"
const DBVERSION = 1

type DBIdentity =  {
    id: number;                 // 29-bit: 23 bits seconds/4 + 6 bits random
    name: string;               // max 16 chars, letters A-Z/a-z + space
    textureIndex: number;       // 0-1023
    colorSchemeIndex: number;   // 0-1023
    offset: number;             // 0-15
    gender: 0 | 1;              // 0 | 1
    created: number;            // timestamp
    cooldown: number;           // timestamp
    selectable: boolean
    origin: string | [number, number]  // qr code or wurmpjes id
    thickness: number          // 8-64
    length: number             // 5-18
}


export type currentIdentity = {
    id: number
    name: string
    gender: 0 | 1 // M | F
    primaryColor: string
    secondaryColor: string
    textureIndex: number;       // 0-1023
    colorSchemeIndex: number;   // 0-1023
    offset: number
    texture: textureInterface
    origin: string | [number, number]
    age: number,
    length: number
    thickness: number
    cooldown: number
}

const identity = defineStore("identity", {
    state: () => ({
        db: undefined as IDBPDatabase | undefined,
        current: undefined as currentIdentity | undefined,
        id: 0,
        name: "",
        gender: 0 as 0 | 1,
        primaryColor: "",
        secondaryColor: "",
        offset: 0,
        texture: undefined as textureInterface | undefined,
        colorschemeIndex: 0,
        origin: undefined as IdentityField | undefined,
        age: 1, // In dagen
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

                this.db = await openDB(DBNAME, DBVERSION, {
                    upgrade(db) {
                        const store = db.createObjectStore("identities", {
                            keyPath: "id",
                        })

                        store.createIndex("cooldown", "cooldown")
                        store.createIndex("created", "created")
                        store.createIndex("name", "name", { unique: true })
                    }
                })

                console.log("Identity database initialized")

                // if (window.location.search.includes("i=")) {
                //     this.loadIdentityFromUrlParam()
                // } 
                
                await this.loadIdentityFromLocalStorage()

                // true
                resolve(true)

                // try {
                //     else {
                //     }
                    
                //     resolve(true)
                // } catch (error) {
                //     console.error("Error during identity initialization:", error)
                //     reject()
                // }
                // setTimeout(() => {
                // }, 1000)
            })
        },
        processIdentityString(identityString: string) {
            const identityModel = new Identity()
            const identity = identityModel.decode(identityString )
            console.log("Decoded identity:", identity)

            this.id = identity.id
            this.name = identity.name
            this.texture = Textures[identity.textureIndex]
            this.primaryColor = ColorScheme[identity.colorSchemeIndex].colors[0]
            this.secondaryColor = ColorScheme[identity.colorSchemeIndex].colors[1]
            this.gender = identity.gender
            this.offset = identity.offset
            this.origin = identity

        },
        loadIdentityFromUrlParam() {
            const urlParams = new URLSearchParams(window.location.search)
            const identityParam = urlParams.get("i")
                    
            if (!identityParam) {
                console.warn("No identity found in URL parameter ?i")
                return
            }
                
            if (identityParam) {
                this.processIdentityString(identityParam)
            }
        },
        async loadIdentityFromLocalStorage() {
            const identityId = localStorage.getItem("selectedIdentity")
            // const identity = await this.findIdentityInDatabase("id", identityId ? parseInt(identityId) : 0) as DBIdentity
            
            if (identityId) {
                await this.selectIdentity(parseInt(identityId))
            } else {
                console.warn(`Identity with id ${identityId} not found in database`)
            }
            
            return this.current
            // if (!identityString) {
            //     console.warn("No identity found in local storage")
            //     return
            // }

            // if (identityString) {
            //     this.processIdentityString(identityString)
            // }

            const birthDate = localStorage.getItem("birthDate")
            if (birthDate) {
                this.age = this.calculateAgeInDays(birthDate)
            }
        },
        calculateAgeInDays(birthDate: string | number): number {
            const birth = new Date(birthDate)
            const now = new Date()
            const diffTime = Math.abs(now.getTime() - birth.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
            return diffDays
        },
        saveIdentityToLocalStorage() {
            const identityModel = new Identity()
            const identity = this.origin
            const identityString = identityModel.encode(identity)
            // Alleen birthdate toevoegen als er nog geen identity in localStorage is
            if (!localStorage.getItem("identity")) {    
                localStorage.setItem("birthDate", new Date().toISOString())
            }
            localStorage.setItem("identity", identityString)
        },
        findIdentityInDatabase(key: string, value: string | number): Promise<DBIdentity> {
            const tx = this.db.transaction("identities", "readonly")
            const store = tx.objectStore("identities")

            return store.getAll().then((allIdentities: DBIdentity[]) => {
                return allIdentities.find((identity) => identity[key as keyof DBIdentity] === value)
            })
        },
        saveIdentityToDatabase(input: IdentityField | string, options : { 
            cooldownDays?: number,
            selectable?: boolean,
            thickness?: number,
            length?: number,
            origin: string | [number, number] 
        } ) {

            const { cooldownDays = 30 } = options
            const { selectable = false } = options
            const { origin } = options
            const { thickness = Math.floor(Math.random()* 16 + 8) } = options
            const { length = Math.floor(Math.random()* 5 + 5) } = options

            const identityField = typeof input === "string" ? new Identity().decode(input) : input
            
            if (!this.db) {
                throw new Error("Database not initialized") 
            }
            
            const tx = this.db.transaction("identities", "readwrite")
            const store = tx.objectStore("identities")
            const dbIdentity: DBIdentity = {
                ...identityField,
                cooldown: cooldownDays ? Date.now() + (cooldownDays * 24 * 60 * 60 * 1000) : 0,
                created: Date.now(),
                selectable,
                origin,
                thickness,
                length
            }

            store.put(dbIdentity)
            return tx.done
        },
        preloadTextures() {
            const promises = [] as Promise<Response>[]
            if (!this.current) {
                return
            }
            const textureUrls = [] as string[]
            const texture = this.current.texture
            if (texture[360]) {
                textureUrls.push(`./bodyparts/360/${texture[360]}`)
            } else if (texture["top"]) {
                textureUrls.push(`./bodyparts/top/${texture["top"]}`)
            } else if (texture["bottom"]) {
                textureUrls.push(`./bodyparts/bottom/${texture["bottom"]}`)
            } else if (texture["vert"]) {
                textureUrls.push(`./bodyparts/vert/${texture["vert"]}`)
            }


            for (let index = 0; index < 8; index++) {
                for (const url of textureUrls) {
                    promises.push(fetch(`${url}/${index}.svg`))
                }
            }

            return Promise.all(promises)
        },
        async selectIdentity(id: number) {
            const identity = await this.findIdentityInDatabase("id", id) as DBIdentity
            this.current = undefined
            if (identity) {
                this.current = {
                    id: identity.id,
                    name: identity.name,
                    gender: identity.gender,
                    primaryColor: ColorScheme[identity.colorSchemeIndex].colors[0],
                    secondaryColor: ColorScheme[identity.colorSchemeIndex].colors[1],
                    offset: identity.offset,
                    texture: Textures[identity.textureIndex],
                    origin: identity.origin,
                    age: this.calculateAgeInDays(identity.created),
                    cooldown: identity.cooldown,
                    textureIndex: identity.textureIndex,
                    colorSchemeIndex: identity.colorSchemeIndex,
                    length: identity.length,
                    thickness: identity.thickness
                } 
            } else {
                console.warn(`Identity with id ${id} not found in database`)
                return undefined
            }

            localStorage.setItem("selectedIdentity", identity.id.toString())

            return this.current
        },
        totalColorSchemes() {
            return ColorScheme.length
        },
        totalTextures() {
            return Textures.length
        },
        getLatinName(colorSchemeIndex: number, textureIndex: number): string {

            const texture = Textures[textureIndex]
            const colorScheme = ColorScheme[colorSchemeIndex]

            if (!texture || !colorScheme) {
                return "undefinedius"
            }

            return `${texture.name} ${colorScheme.name}`
        }
    },
    getters: {
    }
})

export default identity