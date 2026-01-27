<template>
    <article class="wurmpje-card" v-if="identity">
        <span class="wurmpje-card-name">{{ identity.name }}</span>
        <div class="wurmpje-card-thumbnail">
            <wurmpjeThumbnail type="curved" class="wurmpje" :identityField="identity" :redrawKey="redrawKey"/>
            <i class="catterpillar-gender" :class="identity.gender === 0 ? '__isMale' : '__isFemale'">
                <jao-icon :name="identity.gender === 0 ? 'male' : 'female'" size="large" active-color="currentColor" inactive-color="transparent"/>
            </i>
        </div>
        <div class="wurmpje-card-qr" v-html="svg"></div>

        <footer class="wurmpje-card-footer" v-if="showScanButton">
            <button class="wurmpje-card-button button">
                <jao-icon name="camera" size="medium" v-if="showScanButton" inactive-color="transparent"></jao-icon>
                <span class="wurmpje-card-button-text">Scan QR</span>
            </button>
        </footer>
    </article>
</template>



<script lang="ts">
import {defineComponent, type PropType} from "vue"
import Identity, { type IdentityField } from "@/models/identity"
import wurmpjeThumbnail from "@/components/wurmpje-thumbnail.vue";
import qrcode from "qrcode"
import useIdentityStore from "@/stores/identity"
import jaoIcon from "./jao-icon.vue";

export default defineComponent ({ 
    name: "wurmpjeCard",
    components: {
        wurmpjeThumbnail,
        jaoIcon
    },
    props: {
        identity: {
            type: Object as PropType<IdentityField>,
            required: false
        },
        displayAs: {
            type: String as PropType<"parent" | "newborn">,
            required: false,
            default: "parent"
        },
        showScanButton: {
            type: Boolean,
            required: false,
            default: true
        },
    },
    data() {
        return {
            svg: "",
            redrawKey: 0,
        }
    },
    watch: {
        "identity": {
            immediate: true,
            deep: true,
            handler() {
                this.redrawKey ++
                this.generateQR()
            }
        },
        displayAs: {
            immediate: true,
            handler() {
                this.redrawKey ++
                this.generateQR()
            }
        }
    },
    setup() {
        try {
            const identityStore = useIdentityStore()
            
            return {
                identityStore: identityStore
            }
        } catch (e) {
            console.error("Failed to initialise identity store:", e)
        }
    },
    methods: {
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
        getQRstring(){
            let prefix = ""
            if (this.displayAs === "parent") {
                prefix = window.origin + "/?parent="
            } else {
                prefix = window.origin + "/?newborn="
            }
            const identity = new Identity()
            const identityString = identity.encode({
                id: this.identity!.id,
                name: this.identity!.name,
                textureIndex: this.identity!.textureIndex,
                colorSchemeIndex: this.identity!.colorSchemeIndex,
                offset: this.identity!.offset,
                gender: this.identity!.gender,
                length: this.identity!.length,
                thickness: this.identity!.thickness
            })
            
            return prefix + encodeURIComponent(identityString)
        },
        
        
    }
})
</script>


<style> 

 .wurmpje-card {
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

.wurmpje-card-qr {
    #canvas-container {
        overflow: hidden;
        aspect-ratio: 2/1;
    }

    svg {
        padding: 16px 64px;
    }
}

.wurmpje-card-name {
    display: flex;
    justify-content: center;
    font-family: var(--accent-font);
    font-size: 32px;
    height: 80px;
    align-items: center;
    text-align: center;
}

.wurmpje-card-thumbnail {
    position: relative;
    .catterpillar-gender {
        position: absolute;
        right: 8px;
        top: 8px;
        /* translate: -50% -50%; */
        width: 32px;
    }
}

.wurmpje-card-footer {
    display: flex;
    justify-content: center;
}

.wurmpje-card-button {
    display: flex;
    align-items: center;
    gap: 16px;
    font-family: var(--accent-font);
    font-size: 20px;
    padding-left: 16px;
    padding-right: 16px;
    margin-top: -8px;
    margin-bottom: 16px;

    span {
        translate: 0 1px;
        padding-right: 8px;
    }
    
    svg {
        height: 32px;
        padding-left: 4px;
    }
}

</style>