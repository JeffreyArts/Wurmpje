<template>
    <div class="helper">
        <wurmpje-card class="helper-container" v-if="wurmpje" :identity="wurmpje" :displayAs="displayAs" :show-scan-button="false" />

        <div class="helper-form">
            <form class="form" v-if="wurmpje">
                
                <label for="wurmpje-name-input">Name:</label>
                <div class="row">
                    <input id="wurmpje-name-input" pattern="[A-Za-z ]{1,32}" validate type="text" v-model="wurmpje.name" @input="updateWurmpje(true)"/>
                    <span class="wurmpje-name-length" :class="[wurmpje.name.length>=32 ? '__isTooLong': '']">[{{ wurmpje.name.length }}]</span>
                </div>
                <div class="row">
                    <table>
                        <thead>
                            <tr>
                                <th><label for="wurmpje-textureIndex-input">Texture</label></th>
                                <th><label for="wurmpje-colorSchemeIndex-input">Colorscheme</label></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <select name="wurmpje-textureIndex" id="wurmpje-textureIndex-input" v-model="wurmpje.textureIndex" @change="updateWurmpje()">
                                        <option v-for="(texture, index) in textures" :key="index" :value="index">{{ index }} - {{ texture.name }}</option>
                                    </select>
                                </td>
                                <td>
                                    <select name="wurmpje-colorSchemeIndex" id="wurmpje-colorSchemeIndex-input" v-model="wurmpje.colorSchemeIndex" @change="updateWurmpje()">
                                        <option v-for="(colorScheme, index) in colorSchemes" :key="index" :value="index">{{ index }} - {{ colorScheme.name }}</option>
                                    </select>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="row">
                    <table>
                        <thead>
                            <tr>
                                <th><label for="wurmpje-offset-input">Offset</label></th>
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
                                    <input id="wurmpje-length-input" type="number" min="3" max="18" v-model="wurmpje.length" @input="updateWurmpje()"/>
                                </td>
                                <td>
                                    <input id="wurmpje-thickness-input" type="number" min="8" max="40" v-model="wurmpje.thickness" @input="updateWurmpje()"/>
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
                <span class="label">Gender:</span>
                <div class="row display-as-options">
                    <label for="man">
                        <span>Man</span>
                        <input type="radio" name="gender" id="man" :value="0" v-model="wurmpje.gender" @change="updateWurmpje()"/>
                    </label>
                    <label for="woman">
                        <span>Woman</span>
                        <input type="radio" name="gender" id="woman" :value="1" v-model="wurmpje.gender" @change="updateWurmpje()"/>
                    </label>
                </div>
                
                <label for="wurmpje-id-input">ID:</label>
                <div class="row">
                    <input id="wurmpje-id-input" disabled type="number" v-model="wurmpje.id"/>
                    <span @click="generateWurmpje">Regenerate 🔀</span>
                </div>
            </form>
        </div>

    </div>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import useIdentityStore from "@/stores/identity"
import Identity, {type IdentityField } from "@/models/identity";
import Textures from "@/assets/default-textures"
import ColorSchemes from "@/assets/default-color-schemes"
import qrcode from "qrcode"
import JaoIcon from "@/components/jao-icon.vue";
import wurmpjeCard from "@/components/wurmpje-card.vue";

export default defineComponent ({ 
    name: "helperPage",
    components: { 
        wurmpjeCard,
        JaoIcon
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
        this.generateWurmpje()
    },
    methods: {
        generateWurmpje() {
            const identity = new Identity()
            this.wurmpje = {
                id: identity.generateId(),
                name: "Helper Wurmpje",
                textureIndex: Math.floor(Math.random() * this.textures.length),
                colorSchemeIndex: Math.floor(Math.random() * this.colorSchemes.length),
                length: 6,
                thickness: 10,
                offset: Math.floor(Math.random() * 16),
                gender: Math.round(Math.random())

            } as IdentityField

            this.updateWurmpje(false)
        },
        updateWurmpje(ignoreName: boolean = false) {
            if (!this.identity || !this.wurmpje) {
                return
            }   
            this.wurmpje.name = this.wurmpje.name.replace(/[^A-Za-z ]/g, "").slice(0,24)

            const identity = new Identity()
            try {
                identity.encode(this.wurmpje)
            } catch (e) {
                // console.error("Failed to encode wurmpje:", e)
                return
            }
            
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


.helper {
    padding-top: 64px;
    .wurmpje {
        aspect-ratio: 2 / 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .wurmpje-name-length {
        opacity: 0.64;
        font-size: 12px;
        font-family: var(--default-font);
        &.__isTooLong {
            color: red;
        }
    }
}

</style>