import { defineStore } from "pinia"
import ColorScheme from "@/assets/default-color-schemes"
import Identity, { type IdentityField } from "@/models/identity"
import Textures, { type textureInterface } from "@/assets/default-textures"

const identity = defineStore("identity", {
    state: () => ({
        id: 0,
        name: "",
        gender: "" as "M" | "F" | "",
        primaryColor: "",
        secondaryColor: "",
        offset: 0,
        texture: undefined as textureInterface | undefined,
        colorschemeIndex: 0,
        origin: undefined as IdentityField | undefined,
        age: 1, // In dagen
        initialised: undefined as Promise<boolean> | undefined

    }),
    actions: {
        init() {
            this.initialised = new Promise((resolve, reject) => {
                setTimeout(() => {
                    try {

                        if (window.location.search.includes("i=")) {
                            this.loadIdentityFromUrlParam()
                        } else {
                            this.loadIdentityFromLocalStorage()
                        }
                        
                        resolve(true)
                    } catch (error) {
                        console.error("Error during identity initialization:", error)
                        reject()
                    }
                }, 1000)
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
            this.gender = identity.gender ? "F" : "M"
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
        loadIdentityFromLocalStorage() {
            const identityString = localStorage.getItem("identity")
            if (!identityString) {
                console.warn("No identity found in local storage")
                return
            }

            if (identityString) {
                this.processIdentityString(identityString)
            }

            const birthDate = localStorage.getItem("birthDate")
            if (birthDate) {
                const birth = new Date(birthDate)
                const now = new Date()
                const diffTime = Math.abs(now.getTime() - birth.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
                this.age = diffDays
            }
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
        }
    },
    getters: {
    }
})

export default identity