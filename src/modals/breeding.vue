<template>
    <Modal class="breeding-modal" :is-open="isOpen" :auto-close="false" @close-immediate="closeModalImmediate" @close="closeModal" @submit="submit()">
        <template #title v-if="parent">
            <h2 v-if="parent.gender == 0">Who's your daddy! </h2>
            <h2 v-if="parent.gender == 1">Mommy loves you! </h2>
        </template>
        <section class="breeding-container">
            <div class="parent1">
                <figure class="wurmpje-thumbnail-container">
                    <wurmpjeThumbnail type="flat" class="parent-wurmpje" :identityField="parentIdentity" @ready="setParent($event, 1)"/>
                </figure>
                <figcaption class="parent-identity" v-if="parentIdentity">
                    <span class="parent-name">
                        {{ parentIdentity.name }}
                    </span>
                    <span class="parent-gender">
                        {{ parentGender }}
                    </span>
                </figcaption>
            </div>

            <div class="parent2">
                <figure class="wurmpje-thumbnail-container">
                    <wurmpjeThumbnail type="flat" class="parent-wurmpje" :identityField="parentIdentity" @ready="setParent($event, 2)"/>
                </figure>
                <figcaption class="parent-identity" v-if="parentIdentity">
                    <span class="parent-name">
                        {{ parentIdentity.name }}
                    </span>
                    <span class="parent-gender">
                        {{ parentGender }}
                    </span>
                </figcaption>
            </div>
        </section>

        <div class="breeding-container-cta">

            <div class="divider">
                <jao-icon name="heart" size="medium" active-color="var(--color-accent)" inactive-color="transparent"></jao-icon>
            </div>
        </div>

        <template #submit-text>
            Breed
        </template>

    </Modal>
</template>


<script lang="ts">
import { defineComponent, type PropType } from "vue"
import Modal from "@/components/modal.vue";
import jaoIcon from "@/components/jao-icon.vue";
import type { IdentityField } from "@/models/identity";
import wurmpjeThumbnail from "@/components/wurmpje-thumbnail.vue";
import useIdentityStore, { type DBIdentity } from "@/stores/identity";
import type { MatterController } from "@/tamagotchi/controller";


export default defineComponent ({ 
    name: "invalidParentIdModal",
    components: { 
        Modal,
        jaoIcon,
        wurmpjeThumbnail
    },
    props: {
        isOpen: {
            type: Boolean,
            required: false
        },
        parent: {
            type: Object as PropType<IdentityField>,
            required: true
        }
    },
    setup() {
        const identityStore = useIdentityStore()
        
        return {
            identityStore: identityStore
        }
    },
    computed: {
        parentGender() {
            if (!this.parent) {
                return ""
            }
            let gender = "man"
            if (this.parent.gender == 1) {  
                gender = "woman"
            }
            return gender
        }
    },
    watch: {
        parent: {
            handler() {
                this.loadIdentity()
            },
            immediate: true
        }
    },
    data() {
        return {
            parentIdentity: null as DBIdentity | null,
            parent1: null as MatterController | null,
            parent2: null as MatterController | null,
        }
    },
    methods: {
        closeModalImmediate() {
            this.$emit("closeImmediate")
        },
        closeModal() {
            this.$emit("close")
        },
        openModal() {
            // This timeout is needed to force a reset of the modal component
        },
        submit() {
            this.$emit("submit")
        },

        async loadIdentity() {
            if (!this.parent) {
                return;
            }
            
            this.parentIdentity = await this.identityStore.findIdentityInDatabase("id", this.parent.id);
            return this.parentIdentity;
        },
        setParent(controller: MatterController, parentId: number) {
            if (parentId === 1) {
                this.parent1 = controller
            } else {
                this.parent2 = controller
            }

            if (this.parent1) {
                this.parent1.catterpillar.emote("sad")
            }
            if (this.parent2) {
                setTimeout(() =>{

                    this.parent2.catterpillar.emote("kiss")
                }, 2000)
            }

            if (this.parent1) {
                setTimeout(() =>{
                    this.parent1.catterpillar.emote("happy")
                }, 2500)
            }
        }
    }
})

</script>

<style>
.breeding-modal {
    .modal-content {
        max-width: 50vh;
    }

    p {
        margin-bottom: 16px;
    }

    .parent1, .parent2 {
        display: flex;
        flex-flow: column;
        align-items: center;
        width: 100%;
    }

    .parent1 canvas{
        transform: scaleX(-1);
    }

    .parent-wurmpje {
        width: 100%;
        margin: 0;
    }

    .parent-identity {
        display: flex;
        flex-flow: column;
        align-items: center;
        font-family: var(--accent-font);
        font-size: 16px;
    }

    .parent-gender {
        font-size: 14px;
        opacity: 0.64;
    } 

    .wurmpje-thumbnail-container {
        margin: 0;
        width: 100%;
    }

    .breeding-container {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 16px 0;
    }

    .modal-actions {
        justify-content: center;
    }

    .breeding-container-cta {
        .divider {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            svg {
                width: 80px;
            }
        }
    }   
}

</style>