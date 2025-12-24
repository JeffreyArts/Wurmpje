<template>
    <div class="helper">
        <article class="helper-container" v-if="wurmpje">
            <wurmpjeThumbnail type="curved" class="wurmpje" :identityField="wurmpje" :redrawKey="redrawKey"/>
            <form class="form" v-if="wurmpje">
                <div class="row">
                    <label for="wurmpje-id-input">ID:</label>
                    <input id="wurmpje-id-input" disabled type="number" v-model="wurmpje.id"/>
                </div>
                <div class="row">
                    <label for="wurmpje-name-input">Name:</label>
                    <input id="wurmpje-name-input" type="text" v-model="wurmpje.name"/>
                </div>
                <div class="row">
                    <label for="wurmpje-textureIndex-input">textureIndex:</label>
                    <input id="wurmpje-textureIndex-input" type="number" min="0" :max="textures.length-1" v-model="wurmpje.textureIndex"/>
                </div>
                <div class="row">
                    <label for="wurmpje-colorSchemeIndex-input">Colorscheme index:</label>
                    <input id="wurmpje-colorSchemeIndex-input" type="number" min="0" :max="colorSchemes.length-1" v-model="wurmpje.colorSchemeIndex"/>
                </div>
                <div class="row">
                    <label for="wurmpje-offset-input">Offset:</label>
                    <input id="wurmpje-offset-input" type="number" min="0" max="15" v-model="wurmpje.offset"/>
                </div>
                <div class="row">
                    <label for="wurmpje-length-input">Length:</label>
                    <input id="wurmpje-length-input" type="number" min="3" max="18" v-model="wurmpje.length"/>
                </div>
                <div class="row">
                    <label for="wurmpje-thickness-input">Thickness:</label>
                    <input id="wurmpje-thickness-input" type="number" min="8" max="64" v-model="wurmpje.thickness"/>
                </div>
                <div class="row" v-if="parentUrl">
                    <a :href="parentUrl">{{ parentUrl }}</a>
                </div>
            </form>
        </article>

    </div>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import useIdentityStore from "@/stores/identity"
import Identity, {type IdentityField } from "@/models/identity";
import wurmpjeThumbnail from "@/components/wurmpje-thumbnail.vue";
import Textures from "@/assets/default-textures"
import ColorSchemes from "@/assets/default-color-schemes"

export default defineComponent ({ 
    name: "helperPage",
    components: { 
        wurmpjeThumbnail,
    },
    props: [],
    watch: {
        wurmpje: {
            handler(key) {
                const identity = new Identity()
                try {
                    identity.encode(this.wurmpje)
                } catch (e) {
                    // console.error("Failed to encode wurmpje:", e)
                    return
                }
                this.redrawKey ++;
                // Force redraw by changing key
                // this.wurmpje = {...this.wurmpje} as IdentityField
            },
            deep: true
        }
    },
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
    computed: {
        parentUrl() {
            const identity = new Identity()
            const encodedString = identity.encode(this.wurmpje)
            if (!encodedString) {
                return ""
            }
            return `${window.location.origin}?parent=${encodeURIComponent(encodedString)}` 
        }
    },
    data() {
        return {
            wurmpje: null as IdentityField | null,
            textures: Textures,
            colorSchemes: ColorSchemes,
            redrawKey:0
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
        await this.identity.initialised

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
        
    },
    methods: {
    },
})

</script>

<style>
.helper {
    padding-top: 64px;
    .wurmpje {
        aspect-ratio: 1 / 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .form .row {
        gap: 16px;
    }

    .helper-container {
        background-color: #fff;
        margin: auto;
        padding: 16px;
        max-width: 320px;
    }
}

</style>