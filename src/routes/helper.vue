<template>
    <div class="helper">
        <article class="helper-container" v-if="wurmpje">
            <span class="wurmpje-name">{{ wurmpje.name }}</span>
            <wurmpjeThumbnail type="curved" class="wurmpje" :identityField="wurmpje" :redrawKey="redrawKey"/>
            <div class="qr-container" v-html="svg"></div>
        </article>

        <div class="helper-form">
            <form class="form" v-if="wurmpje">
                
                <label for="wurmpje-name-input">Name:</label>
                <div class="row">
                    <input id="wurmpje-name-input" type="text" v-model="wurmpje.name" @input="updateWurmpje(true)"/>
                    <span class="wurmpje-name-length" :class="[wurmpje.name.length>=24 ? '__isTooLong': '']">[{{ wurmpje.name.length }}]</span>
                </div>
                <div class="row">
                    <table>
                        <thead>
                            <tr>
                                <th><label for="wurmpje-offset-input">Offset</label></th>
                                <th><label for="wurmpje-textureIndex-input">Texture</label></th>
                                <th><label for="wurmpje-colorSchemeIndex-input">Colorscheme</label></th>
                                <th><label for="wurmpje-length-input">Length</label></th>
                                <th><label for="wurmpje-thickness-input">Thickness</label></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <input id="wurmpje-offset-input" type="number" min="0" max="15" v-model="wurmpje.offset" @input="updateWurmpje()"/>
                                </td>
                                <td>
                                    <input id="wurmpje-textureIndex-input" type="number" min="0" :max="textures.length-1" v-model="wurmpje.textureIndex" @input="updateWurmpje()"/>
                                </td>
                                <td>
                                    <input id="wurmpje-colorSchemeIndex-input" type="number" min="0" :max="colorSchemes.length-1" v-model="wurmpje.colorSchemeIndex" @input="updateWurmpje()"/>
                                </td>
                                <td>
                                    <input id="wurmpje-length-input" type="number" min="3" max="18" v-model="wurmpje.length" @input="updateWurmpje()"/>
                                </td>
                                <td>
                                    <input id="wurmpje-thickness-input" type="number" min="0" max="32" v-model="wurmpje.thickness" @input="updateWurmpje()"/>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <span class="label">QR code for:</span>
                <div class="row display-as-options">
                    <label for="parent">
                        <span>Parent</span>
                        <input type="radio" name="display-as" id="parent" value="parent" v-model="displayAs" @change="updateWurmpje()"/>
                    </label>
                    <label for="newborn">
                        <span>Newborn</span>
                        <input type="radio" name="display-as" id="newborn" value="newborn" v-model="displayAs" @change="updateWurmpje()"/>
                    </label>
                </div>
                
                <label for="wurmpje-id-input">ID:</label>
                <div class="row">
                    <input id="wurmpje-id-input" disabled type="number" v-model="wurmpje.id"/>
                </div>
            </form>
        </div>

    </div>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import useIdentityStore from "@/stores/identity"
import Identity, {type IdentityField } from "@/models/identity";
import wurmpjeThumbnail from "@/components/wurmpje-thumbnail.vue";
import Textures from "@/assets/default-textures"
import ColorSchemes from "@/assets/default-color-schemes"
import qrcode from "qrcode"

export default defineComponent ({ 
    name: "helperPage",
    components: { 
        wurmpjeThumbnail,
    },
    props: [],
    // watch: {
    // },
    setup() {
        try {
            const identityStore = useIdentityStore()
            
            return {
                identity: identityStore
            }
        } catch (e) {
            console.error("Failed to initialise identity store:", e)
        }
    },
    data() {
        return {
            wurmpje: null as IdentityField | null,
            textures: Textures,
            colorSchemes: ColorSchemes,
            redrawKey: 0,
            svg: "",
            displayAs: "parent" as "parent" | "newborn"
        }
    },
    head: { 
        title: "Home",
        meta: [
            {
                name: "description",
                content: "Welcome to the world of Wurmpje, your personal digital pet!",
            },
        ]
    },
    async mounted() {
        if (!this.identity.isInitialized) {
            await this.identity.initialised
        }

        const identity = new Identity()
        this.wurmpje = {
            id: identity.generateId(),
            name: "Helper Wurmpje",
            textureIndex: Math.floor(Math.random() * this.textures.length),
            colorSchemeIndex: Math.floor(Math.random() * this.colorSchemes.length),
            length: 8,
            thickness: 16,
            offset: Math.floor(Math.random() * 16),
            gender: Math.round(Math.random())

        } as IdentityField

        this.updateWurmpje(true)
    },
    methods: {
        getQRstring(){
            let prefix = ""
            if (this.displayAs === "parent") {
                prefix = window.origin + "/?parent="
            } else {
                prefix = ""
            }
            const identity = new Identity()
            const identityString = identity.encode({
                id: this.wurmpje!.id,
                name: this.wurmpje!.name,
                textureIndex: this.wurmpje!.textureIndex,
                colorSchemeIndex: this.wurmpje!.colorSchemeIndex,
                offset: this.wurmpje!.offset,
                gender: this.wurmpje!.gender,
                length: this.wurmpje!.length - 3,
                thickness: this.wurmpje!.thickness
            })
            
            return prefix + encodeURIComponent(identityString)
        },
        generateQR() {
            const qrString = this.getQRstring()
            qrcode.toString( qrString, {type: "svg", margin: 0}, (err, svgString) => {
                if (err) {
                    console.error("Failed to generate QR code:", err)
                    return
                }
                this.svg = svgString
            } )
        },
        updateWurmpje(ignoreName: boolean = false) {

            if (!this.identity || !this.wurmpje) {
                return
            }   
            const identity = new Identity()
            try {
                identity.encode(this.wurmpje)
            } catch (e) {
                // console.error("Failed to encode wurmpje:", e)
                return
            }
            
            this.generateQR()
            this.redrawKey ++;
            this.wurmpje.id = identity.generateId()

            if (ignoreName) {
                return
            }
            this.wurmpje.name = this.identity.getLatinName(this.wurmpje.colorSchemeIndex,this.wurmpje.textureIndex)
        }
    },
})

</script>

<style>
.helper {
    padding-top: 64px;
    .wurmpje {
        aspect-ratio: 2 / 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }


    .helper-container {
        background-color: #fff;
        margin: auto;
        padding: 16px;
        max-width: 320px;
        box-shadow: 0 0 16px rgba(0,0,0,0.2);
        border-radius: 8px;
        display: flex;
        flex-flow: column;
        gap: 16px;
    }

    #canvas-container {
        overflow: hidden;
        aspect-ratio: 2/1;
    }

    .wurmpje-name {
        display: flex;
        justify-content: center;
        font-family: var(--accent-font);
        font-size: 32px;
        height: 80px;
        align-items: center;
        text-align: center;
    }

    .wurmpje-name-length {
        opacity: 0.64;
        font-size: 12px;
        font-family: var(--default-font);
        &.__isTooLong {
            color: red;
        }
    }

    .qr-container {
        svg {
            padding: 16px 64px;
        }
    }
}

.helper-form .form{
    margin: auto;
    width: calc(100% - 64px);
    max-width: 400px;
    margin-top: 64px;

    .row {
        gap: 8px;
    }

    table {
        width: 100%;
        text-align: left
    }

    .display-as-options {
        gap: 16px;
    }

    .label,
    label {
        display: inline-block;
        font-family: var(--accent-font);
    }

    #wurmpje-name-input {
        width: calc(100% - 32px);
    }

    input[type="radio"] {
        margin: 0 0 0 4px;
        translate: 0 2px;
    }
}

</style>