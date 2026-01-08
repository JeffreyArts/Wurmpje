<template>
    <Modal class="succesful-setup-scan-modal" :is-open="showModal" :auto-close="false" @close-immediate="closeModalImmediate" @close="closeModal" @submit="submit()">
        <template #title>
            <h2>{{ successMessage }}</h2>
        </template>
        <p>
            You can give your wurmpje a name, or leave it blank to use its Latin name. Close the window to scan another QR code.
        </p>

        <form @submit.prevent="submit()" class="form" id="submit-name-form">
            <div class="row" v-if="newIdentity">
                <i class="icon">
                    <jao-icon :name="newIdentity.gender === 0 ? 'male' : 'female'" size="large" inactive-color="transparent" activeColor="var(--bg-color)"/>
                </i>
                <input type="text" :placeholder="latinName" class="input large" v-model="newIdentity.name" maxlength="24" />
            </div>
        </form>
        
        <template #submit-text>
            Name Wurmpje
        </template>
    </Modal>
</template>


<script lang="ts">
import { defineComponent, type PropType } from "vue"
import useIdentityStore from "@/stores/identity"
import Modal from "@/components/modal.vue";
import jaoIcon from "@/components/jao-icon.vue";
import { type IdentityField } from "@/models/identity";

export default defineComponent ({ 
    name: "succesfulSetupScanModal",
    components: { 
        Modal,
        jaoIcon
    },
    props: {
        newIdentity: {
            type: Object as PropType<IdentityField>,
            required: false
        },
        isOpen: {
            type: Boolean,
            required: false
        }   
    },
    
    setup() {
        const identityStore = useIdentityStore()
        identityStore.init()
        
        return {
            identity: identityStore
        }
    },
    watch: {
        isOpen: {
            handler(val) {
                if (val) {
                    this.openModal()
                } else {
                    this.closeModal()
                }
            },
            immediate: true
        },
    },
    computed: {
        latinName() {
            if (this.newIdentity) {
                return this.identity.getLatinName(this.newIdentity.colorSchemeIndex,this.newIdentity.textureIndex)
            }
            return ""
        }
    },
    data() {
        return {
            successLines: [
                "🔥🔥🔥",
                "💪🐛",
                "You found a wurmpje!",
                "Nice!",
                "Nice one!",
                "Found one!",
                "You found one!",
                "YEAH!! You found one!",
            ] as Array<string>,
            successMessage: "",
            showModal: false,
            
        }
    },
    async mounted() {
        this.successMessage = this.successLines[Math.floor(Math.random() * this.successLines.length)]
    },
    methods: {
        closeModalImmediate() {
            this.$emit("closeImmediate")
        },
        closeModal() {
            this.showModal = false
            this.$emit("close")
        },
        openModal() {
            // This timeout is needed to force a reset of the modal component
            this.showModal = false
            setTimeout(() => {
                this.showModal = true
            }, 0)
        },
        submit() {
            this.$emit("submit")
        }
    }
})

</script>

<style>
.succesful-setup-scan-modal {
    .modal-overlay {
        max-width: 400px;
    }

    p {
        margin-bottom: 16px;
    }
}


</style>