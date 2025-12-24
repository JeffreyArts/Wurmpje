<template>
    <Modal class="breeding-modal" :is-open="isOpen" :auto-close="false" @close-immediate="closeModalImmediate" @close="closeModal" @submit="submit()">
        <template #title v-if="parent">
            <h2 v-if="parent.gender == 1">Who's your daddy? </h2>
            <h2 v-if="parent.gender == 0">Who's your mommy? </h2>
        </template>
        <section class="breeding-container">
            <div class="parent1">
                <figure class="wurmpje-thumbnail-container">
                    <wurmpjeThumbnail type="flat" class="parent-wurmpje" :identityField="parentIdentity" @ready="setParent($event, parentIdentity)"/>
                </figure>
            </div>
            <div class="parent2">
                <figure class="wurmpje-thumbnail-container">
                    <div class="select-wurmpje-container" ref="wurmpjes-container">
                        <div class="button-container" @click="decreaseSelectedParent2Index">
                            <jao-icon name="chevron-top" size="small" active-color="var(--color-accent)" inactive-color="transparent" :style="[disableDecreaseChevron ? 'opacity: .4' : '']"></jao-icon>
                        </div>
                        <div class="select-wurmpje-spacer">
                            <div class="select-wurmpje" v-for="(wurmpje,w) in optionalParents">
                                <!-- {{  wurmpje }} -->
                                <wurmpjeThumbnail :id="`wurmpje-${w}`" type="flat" class="parent-wurmpje" :identityField="wurmpje" @ready="setParent($event, wurmpje)"/>
                            </div>
                        </div>
                        <div class="button-container" @click="increaseSelectedParent2Index">
                            <jao-icon name="chevron-bottom" size="small" active-color="var(--color-accent)" inactive-color="transparent" :style="[disableIncreaseChevron ? 'opacity: .4' : '']"></jao-icon>
                        </div>
                    </div>
                </figure>
            </div>
        </section>
        <footer class="breeding-container">
            <figcaption class="parent-identity" v-if="parentIdentity">
                <span class="parent-name">
                    {{ parentIdentity.name }}
                </span>
                <span class="parent-gender">
                    {{ gender(parentIdentity) }}
                </span>
            </figcaption>
            <figcaption class="parent-identity" v-if="optionalParents[selectedParent2Index]">
                <span class="parent-name">
                    {{ optionalParents[selectedParent2Index].name }}
                    <!-- {{ parentIdentity.name }} -->
                </span>
                <span class="parent-gender">
                    {{ gender(optionalParents[selectedParent2Index]) }}
                    <!-- {{ parentGender }} -->
                </span>
            </figcaption>
        </footer>

        <div class="breeding-container-cta">
            <div class="divider" @click="submit">
                <jao-icon name="heart" size="medium" active-color="var(--color-accent)" inactive-color="transparent"></jao-icon>
            </div>
        </div>

        <template #submit-text>
            Make love
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
import gsap from "gsap";

interface DBIdentityWithController extends DBIdentity {
    controller?: MatterController
}

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
            parentIdentity: null as DBIdentityWithController | null,
            // parent1: null as MatterController | null,
            // parent2: null as MatterController | null,
            optionalParents: [] as DBIdentityWithController[],
            selectedParent2Index: 0,
            disableDecreaseChevron: true,
            disableIncreaseChevron: false
        }
    },
    mounted() {
    },
    methods: {
        async getOptionalParents(parent: DBIdentity) {
            const oppositeGender = parent.gender == 1 ? 0 : 1
            await this.identityStore.findIdentityInDatabase("gender", oppositeGender).then((parents) => {
                if (Array.isArray(parents)) {
                    this.optionalParents = parents
                } else if (parents) {
                    this.optionalParents = [parents]
                }
                console.log("Found optional parents:", parents)
            })
        },
        decreaseSelectedParent2Index() {
            if (this.selectedParent2Index > 0) {
                this.selectedParent2Index -= 1
            } 
            
            if (this.selectedParent2Index == 0) {
                this.disableDecreaseChevron = true
            } else {
                this.disableDecreaseChevron = false
            }

            this.disableIncreaseChevron = false
            this.selectWurmpje(this.selectedParent2Index)
        },
        increaseSelectedParent2Index() {
            if (this.selectedParent2Index < this.optionalParents.length - 1) {
                this.selectedParent2Index += 1
            } 
            
            if (this.selectedParent2Index == this.optionalParents.length - 1) {
                this.disableIncreaseChevron = true
            } else {
                this.disableIncreaseChevron = false
            }

            this.disableDecreaseChevron = false
            this.selectWurmpje(this.selectedParent2Index)
        },
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
            console.log("Breeding submitted")
        },
        gender(identity: DBIdentity) {
            if (!identity) {
                return ""
            }
            let gender = "man"
            if (identity.gender == 1) {  
                gender = "woman"
            }
            return gender
        },

        async loadIdentity() {
            if (!this.parent) {
                return;
            }
            
            const parentIdentity = await this.identityStore.findIdentityInDatabase("id", this.parent.id);
            if (parentIdentity && !Array.isArray(parentIdentity)) {
                this.parentIdentity = parentIdentity;
                await this.getOptionalParents(this.parentIdentity)
            }

            return this.parentIdentity;
        },
        setParent(controller: MatterController, targetIdentity: DBIdentityWithController) {
            targetIdentity.controller = controller

            gsap.to(".parent1 .parent-wurmpje, .parent2 .select-wurmpje:first-child .parent-wurmpje", {
                duration: 0.72,
                opacity: 1,
                ease: "power2.out",
            })
        },
        interact() {
            const parent1 = this.parentIdentity
            const parent2 = this.optionalParents[this.selectedParent2Index]
            if (parent1.controller) {
                parent1.controller.catterpillar.emote("sad")
            }
            if (parent2.controller) {
                setTimeout(() =>{   
                    parent2.controller.catterpillar.emote("kiss")
                }, 2000)
            }

            if (parent1.controller) {
                setTimeout(() =>{
                    parent1.controller.catterpillar.emote("happy")
                }, 2500)
            }
        },
        selectWurmpje(index: number) {
            this.selectedParent2Index = index
            const wurmpjesContainer = this.$refs["wurmpjes-container"] as HTMLElement
            const target = wurmpjesContainer.querySelector(`#wurmpje-${index}`)
            const nextTarget = wurmpjesContainer.querySelector(`#wurmpje-${index + 1}`)
            const prevTarget = wurmpjesContainer.querySelector(`#wurmpje-${index - 1}`)

            this.interact()

            if (target) {
                gsap.to(target, {
                    duration: 0.72,
                    opacity: 1,
                    ease: "power2.out",
                    y: 0
                })
            }

            if (nextTarget) {
                gsap.to(nextTarget, {
                    duration: 0.72,
                    opacity: 0,
                    ease: "power2.out",
                    y: 48
                })
            }

            if (prevTarget) {
                gsap.to(prevTarget, {
                    duration: 0.72,
                    opacity: 0,
                    ease: "power2.out",
                    y: -48
                })
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
        justify-content: center;
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

    .wurmpje-thumbnail {
        height: 100px;
        opacity: 0;
    }

    .wurmpje-thumbnail-container {
        margin: 0;
        width: 100%;
        display: flex;
        justify-content: center;
        flex-flow: column;
        align-items: center;
    }

    .select-wurmpje {
        width: 100%;  
        height: 150px;
        display: flex;  
        justify-content: center;
        flex-flow: column;
        position: absolute;
        top: 50%;
        translate: 0 -50%;
        pointer-events: none;
    }
    
    .select-wurmpje-spacer {
        width: 100%;  
        height: 150px;
    }

    .select-wurmpje-container {
        width: 100%;
        display: flex;
        flex-flow: column;
        align-items: center;
        position: relative;

        svg {
            width: 33px;
        }
    }

    .breeding-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
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

    .button-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
    }
}

</style>