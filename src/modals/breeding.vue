<template>
    <Modal class="breeding-modal" :is-open="isOpen" :hide-submit="true" :auto-close="false" @close-immediate="closeModalImmediate" @close="closeModal" @submit="submit()">
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
                            <jao-icon name="chevron-top" :disabled="disableDecreaseChevron" size="small" active-color="var(--color-accent)" inactive-color="transparent" :style="[disableDecreaseChevron ? 'opacity: .4' : '']"></jao-icon>
                        </div>
                        <div class="select-wurmpje-spacer">
                            <p  v-if="optionalParents.length <= 0 && parent">
                                 <span v-if="parent.gender == 1">Mommy needs a daddy</span>
                                 <span v-if="parent.gender == 0">Daddy needs a mommy</span>
                            </p>

                            <div class="select-wurmpje" v-for="(wurmpje,w) in optionalParents" v-if="optionalParents.length > 0">
                                <!-- {{  wurmpje }} -->
                                <wurmpjeThumbnail :id="`wurmpje-${w}`" type="flat" class="parent-wurmpje" :identityField="wurmpje" @ready="setParent($event, wurmpje)"/>
                            </div>
                        </div>
                        <div class="button-container" :disabled="disableIncreaseChevron" @click="increaseSelectedParent2Index">
                            <jao-icon name="chevron-bottom" size="small" active-color="var(--color-accent)" inactive-color="transparent" :style="[disableIncreaseChevron ? 'opacity: .4' : '']"></jao-icon>
                        </div>
                    </div>
                </figure>
            </div>
        </section>
        <footer class="breeding-container">
            <figcaption class="parent-identity" v-if="parentIdentity">
                <span class="parent-name" v-if="!isCoolingDown(parentIdentity)">
                    {{ parentIdentity.name }}
                </span>
                <span class="parent-gender" v-if="!isCoolingDown(parentIdentity)">
                    {{ gender(parentIdentity) }}
                </span>
                <span class="parent-cooldown" v-if="isCoolingDown(parentIdentity)">
                    This wurmpje needs some time before it can make love again.
                </span>
            </figcaption>
            <figcaption class="parent-identity" v-if="optionalParents[selectedParent2Index]">
                <span class="parent-name" v-if="!hasError">
                    {{ optionalParents[selectedParent2Index].name }}
                </span>
                <span class="parent-gender" v-if="!hasError">
                    {{ gender(optionalParents[selectedParent2Index]) }}
                </span>
                <span class="parent-cooldown" v-if="hasError">
                    {{errorMessage}}
                </span>
                <span class="parent-name">
                    
                    <!-- {{ parentIdentity.name }} -->
                </span>
                <span class="parent-gender">
                    <!-- {{ parentGender }} -->
                </span>
            </figcaption>
        </footer>

        <div class="breeding-container-cta" v-if="optionalParents.length == 0">
            <p>Go look for a {{ oppositeSex }} wurmpje and try again.</p>
        </div>
        <div class="breeding-container-cta" :class="[loveIsDisabled ? '__isDisabled' : '']" v-if="optionalParents.length > 0">
            <div class="divider" @click="submit">
                <jao-icon name="heart" size="medium" active-color="var(--color-accent)" inactive-color="transparent"></jao-icon>
                <button class="modal-submit" type="submit"> Make love </button>
            </div>
        </div>
    </Modal>
</template>


<script lang="ts">
import { defineComponent, type PropType, type Ref } from "vue"
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
        oppositeSex(): string {
            if (!this.parent) {
                return ""
            }
            if (this.parent.gender == 1) {
                return "male"
            } else {
                return "female"
            }
        },
        loveIsDisabled() {
            if (!this.parentIdentity) {
                return true
            }

            if (!this.optionalParents || !this.optionalParents[this.selectedParent2Index]) {
                return true
            }

            return this.isCoolingDown(this.parentIdentity) || this.isCoolingDown(this.optionalParents[this.selectedParent2Index])
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
            parentIdentity: null as DBIdentityWithController | null,
            // parent1: null as MatterController | null,
            // parent2: null as MatterController | null,
            optionalParents: [] as DBIdentityWithController[],
            selectedParent2Index: 0,
            disableDecreaseChevron: true,
            disableIncreaseChevron: false,
            parent1Timeout: 0 as number | NodeJS.Timeout,
            hasError: false,
            errorMessage: "",
            potentialPartnersSeen: 0
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
            })

            // Remove all dead wurmpjes from the optional parents list
            this.optionalParents = this.optionalParents.filter((identity) => !identity.death)
            

            if (this.optionalParents.length <= 1) {
                this.disableIncreaseChevron = true
                this.disableDecreaseChevron = true
            }
        },
        decreaseSelectedParent2Index() {
            if (this.optionalParents.length <= 0) {
                return
            }

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
            if (this.optionalParents.length <= 0) {
                return
            }
            
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
        isCoolingDown(identity: DBIdentity) {
            if (!identity?.cooldown) {
                return false
            }
            const now = Date.now()
            return identity.cooldown > now
        },
        async submit() {
            this.$emit("submit")
            
            const parent1 = this.parentIdentity
            const parent2 = this.optionalParents[this.selectedParent2Index]
            const babyWurmpje = await this.identityStore.breedWurmpje(parent1, parent2)

            if (!babyWurmpje) {
                return
            }

            if (parent1) {
                // Set cooldown 7 days from now
                parent1.cooldown = Date.now() + 7 * 24 * 60 * 60 * 1000
                await this.identityStore.updateIdentityInDatabase(parent1.id, { cooldown: parent1.cooldown })
            }

            if (parent2) {
                // Set cooldown 7 days from now
                parent2.cooldown = Date.now() + 7 * 24 * 60 * 60 * 1000
                await this.identityStore.updateIdentityInDatabase(parent2.id, { cooldown: parent2.cooldown })
            }

            this.identityStore.selectIdentity(Number(babyWurmpje.id))
            this.closeModal()
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
        checkPartnerValidity() {
            if (!this.selectedParent2Index) {
                return
            }
            const partner = this.optionalParents[this.selectedParent2Index]
            this.hasError = false
            this.errorMessage = ""

            // Check for minimum length
            if (partner.length < 6) {
                this.errorMessage = "This wurmpje is not long enough to make love."
                this.hasError = true
                return
            }
            
            // Check for age
            if (this.isCoolingDown(partner)) {
                this.errorMessage = "This wurmpje needs some time before it can make love again."
                this.hasError = true
                return
            }
        },
        async loadIdentity() {
            if (!this.parent) {
                return;
            }
            
            const parentIdentity = await this.identityStore.findIdentityInDatabase("id", this.parent.id);
            if (parentIdentity && !Array.isArray(parentIdentity)) {
                this.parentIdentity = parentIdentity as DBIdentityWithController;
                await this.getOptionalParents(this.parentIdentity)
            }

            this.checkPartnerValidity()
            return this.parentIdentity;
        },
        setParent(controller: MatterController, targetIdentity: DBIdentity | DBIdentityWithController | null) {
            if (!targetIdentity) {
                return
            }
            const ti = targetIdentity as DBIdentityWithController
            ti.controller = controller as MatterController
            
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

            clearTimeout(this.parent1Timeout)
            if (parent1.controller) {
                this.parent1Timeout = setTimeout(() =>{
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

            this.checkPartnerValidity()
            if (!this.hasError) {
                // Only wink to potential partners
                this.potentialPartnersSeen = 0
                this.interact()
            } else {
                if (this.potentialPartnersSeen < 3) {
                    this.parentIdentity.controller.catterpillar.emote("happy")
                } else if (this.potentialPartnersSeen < 5 ) {
                    this.parentIdentity.controller.catterpillar.emote("hmm")
                } else {
                    this.parentIdentity.controller.catterpillar.emote("sad")
                } 
                this.potentialPartnersSeen += 1
            }

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

    .parent-cooldown {
        text-align: center;
        line-height: .9;
        font-weight: normal;
        font-size: 14px;
        opacity: 0.8;
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
        text-align: center;
        margin-top: 16px;

        &.__isDisabled {
            pointer-events: none;
            opacity: 0.4;
        }

        .divider {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-flow: column;
            width: 100%;
            gap: 24px;
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