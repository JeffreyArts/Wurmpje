<template>
    <Modal class="select-identity-modal" :is-open="isOpen" :hide-submit="!hasOptions" @close-immediate="closeModalImmediate" @close="closeModal" @submit="submit()">
        <template #title>
            <h2>Pick Wurmpje</h2>
        </template>
        <section class="select-identity-container">
            <div class="selected-identity-container" v-if="hasOptions">
                <jao-icon name="chevron-left" class="prev-action" size="small" active-color="#333" inactive-color="transparent" @click="selectPreviousIdentity"/>
                <div class="wurmpje-window">
                    <div class="wurmpje-window-animation-helper">
                        <div class="selected-wurmpje">
                            <wurmpjeThumbnail type="curved" :identityField="selectedIdentity"></wurmpjeThumbnail>
                            <h3 class="wurmpje-name" v-if="selectedIdentity">{{ selectedIdentity.name }}</h3>
                             <div class="stats">
                                <div class="healthbar-row" v-if="selectedIdentity">
                                    <healthbar :value="selectedIdentity.joy" />
                                    <span class="healthbar-name">joy</span>
                                </div>
                                <div class="healthbar-row" v-if="selectedIdentity">
                                    <healthbar :value="selectedIdentity.love" />
                                    <span class="healthbar-name">love</span>
                                </div>
                                <div class="healthbar-row" v-if="selectedIdentity">
                                    <healthbar :value="selectedIdentity.hunger" />
                                    <span class="healthbar-name">hunger</span>
                                </div>
                            </div>
                        </div>
                        <div class="new-wurmpje">
                            <wurmpjeThumbnail type="curved" :identityField="newIdentity"></wurmpjeThumbnail>
                            <h3 class="wurmpje-name" v-if="newIdentity">{{ newIdentity.name }}</h3>
                             <div class="stats">
                                <div class="healthbar-row" v-if="newIdentity">
                                    <healthbar :value="newIdentity.joy" />
                                    <span class="healthbar-name">joy</span>
                                </div>
                                <div class="healthbar-row" v-if="newIdentity">
                                    <healthbar :value="newIdentity.love" />
                                    <span class="healthbar-name">love</span>
                                </div>
                                <div class="healthbar-row" v-if="newIdentity">
                                    <healthbar :value="newIdentity.hunger" />
                                    <span class="healthbar-name">hunger</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <jao-icon name="chevron-right" class="next-action" size="small" active-color="#333" inactive-color="transparent" @click="selectNextIdentity"/>
            </div>

            <div class="parents" v-if="parents.mother && parents.father">
                <table>
                    <tbody>
                        <tr>
                            <td><h3 class="parent-gender">Mother</h3></td>
                            <td><h3 class="parent-gender">Father</h3></td>
                        </tr>
                        <tr>
                            <td><wurmpjeThumbnail type="flat" :identityField="parents.mother"></wurmpjeThumbnail></td>
                            <td><wurmpjeThumbnail type="flat" :identityField="parents.father"></wurmpjeThumbnail></td>
                        </tr>
                        <tr>
                            <td><h3 class="parent-name">{{ parents.mother.name }}</h3></td>
                            <td><h3 class="parent-name">{{ parents.father.name }}</h3></td>
                        </tr>
                        <tr class="parent-select">
                            <td><span class="button __isSmall" v-if="availableParent(parents.mother.id)" @click="selectParent(parents.mother.id)">Select</span></td>
                            <td><span class="button small" v-if="availableParent(parents.father.id)" @click="selectParent(parents.father.id)">Select</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="!hasOptions">
                <p>You don't have any (alive) wurmpjes to pick from.</p>
                <p v-if="mommies.length > 0 && daddies.length === 0">Note that you can not pick random mommies, go find them a man first.</p>
                <p v-if="daddies.length > 0 && mommies.length === 0">Note that you can not pick random daddies, go find them a woman first.</p>
                <p v-if="!potentialMatch">Try to scan some QR codes and see if you can find a wurmpje in one of them.</p>
                <p v-if="potentialMatch">But maybe you can make one 😏.</p>
                <p v-if="potentialMatch"><button class="button" @click="openTheBreedingModal">Let's make one</button></p>
            </div>
        </section>
        <template #submit-text>
            Pick
        </template>
    </Modal>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import Modal from "@/components/modal.vue";
import jaoIcon from "@/components/jao-icon.vue";
import wurmpjeThumbnail from "@/components/wurmpje-thumbnail.vue";
import useIdentityStore, { type DBIdentity, type currentIdentity} from "@/stores/identity";
import type { IdentityField } from "@/models/identity";
import ColorScheme from "@/assets/default-color-schemes"
import Textures from "@/assets/default-textures";
import gsap from "gsap";
import healthbar from "@/components/healthbar.vue";


export default defineComponent ({ 
    name: "selectIdentityModal",
    components: { 
        Modal,
        jaoIcon,
        wurmpjeThumbnail,
        healthbar
    },
    props: {
        isOpen: {
            type: Boolean,
            required: false
        },
    },
    setup() {
        const identityStore = useIdentityStore()
        
        return {
            identityStore: identityStore
        }
    },
    computed: {
       hasOptions() {
            if (!this.allIdentityOptions) {
                return false
            }
           return this.allIdentityOptions.length > 0
       },
       mommies() {
           return this.allAliveIdentities.filter(wurmpje => wurmpje.gender === 1 && !wurmpje.death)
       },
       daddies() {
           return this.allAliveIdentities.filter(wurmpje => wurmpje.gender === 0 && !wurmpje.death)
       },
       potentialMatch() {
            return this.checkForPartner(0)
       }
    },
    watch: {
       
    },
    data() {
        return {
            allIdentityOptions: [] as DBIdentity[],
            allAliveIdentities: [] as DBIdentity[],
            selectedIdentity: undefined as currentIdentity | undefined,
            newIdentity: undefined as currentIdentity | undefined,
            openBreedingModal: false,
            currentIndex: 0,
            parents: {
                mother: null as IdentityField | null,
                father: null as IdentityField | null
            }
        }
    },
    async mounted() {
        if (!this.identityStore.isInitialized) {
            await this.identityStore.initialised
        }


        this.allAliveIdentities = await this.identityStore.getAllAliveIdentitiesFromDatabase()
        this.allIdentityOptions = this.allAliveIdentities.filter(identity => identity.origin !== "parent")
        this.currentIndex = 0
        if (this.identityStore.current && !this.identityStore.current.death) {
            // get index of current identity
            this.currentIndex = this.allIdentityOptions.findIndex(id => id.id === this.identityStore.current?.id)
        }
        
        this.updateSelectedIdentity()
    },
    methods: {
        updateSelectedIdentity() {
            const selectedIdentity = this.allIdentityOptions[this.currentIndex]
            this.selectedIdentity = this.parseIdentity(selectedIdentity)
            this.updateFamilytree()
        },
        openTheBreedingModal() {
            this.$emit("open-breeding-modal", this.checkForPartner(0))
            this.closeModalImmediate()
        },
        
        isCoolingDown(identity: DBIdentity) {
            if (!identity?.cooldown) {
                return false
            }
            const now = Date.now()
            return identity.cooldown > now
        },

        checkForPartner(index) {
            const partner = this.allAliveIdentities[index]
            if (!partner) {
                return null
            }

            let matchingPartner = this.allAliveIdentities.find((identity) => {
                
                if (partner.gender === identity.gender) {
                    return
                }
                
                if (identity.length < 6) {
                    return
                }
                
                // Check for age
                if (this.isCoolingDown(identity)) {
                    return
                }

                return identity
            })
            
            if (!matchingPartner) {
                return this.checkForPartner(index + 1)
            }
            
            return matchingPartner
        },
        updateFamilytree() {
            if (!this.selectedIdentity) {
                return
            }
            
            if (this.selectedIdentity.origin) {
                this.parents.mother = null
                this.parents.father = null
                this.selectedIdentity.origin.split(",").forEach(async (str) => {
                    if (str.startsWith("mom:")) {
                        const motherId = str.replace("mom:", "")
                        const motherIdentity = await this.identityStore.findIdentityInDatabase("id", parseInt(motherId))

                        if (Array.isArray(motherIdentity)) {
                            return
                        }
                        this.parents.mother = this.parseIdentity(motherIdentity)
                        
                    } else if (str.startsWith("dad:")) {
                        const fatherId = str.replace("dad:", "")
                        const fatherIdentity = await this.identityStore.findIdentityInDatabase("id", parseInt(fatherId))
                        if (Array.isArray(fatherIdentity)) {
                            return
                        }
                        this.parents.father = this.parseIdentity(fatherIdentity)
                    }
                })
            }
        },
        updateNewIdentity(index) {
            const newIdentity = this.allIdentityOptions[index]
            this.newIdentity = this.parseIdentity(newIdentity)
        },
        availableParent(parentId) {
            return this.allIdentityOptions.findIndex(id => id.id === parentId) !== -1
        },
        selectParent(parentId: number) {
            const parentIndex = this.allIdentityOptions.findIndex(id => id.id === parentId)
            if (parentIndex === -1) {
                return
            }
            this.currentIndex = parentIndex
            this.updateNewIdentity(parentIndex)
            this.switchIdentity("up")
        },
        switchIdentity(direction = "left") {
            let selectedWumpjeLeft = { left: 200, top: 0 }
            let newWumpjeLeft = { left: -200, top: 0 }
            
            if (direction == "up") {
                selectedWumpjeLeft = { left: 0, top: -220 }
                newWumpjeLeft = { left: 0, top: 220 }
            } else if (direction == "right") {
                selectedWumpjeLeft = { left: -200, top: 0 }
                newWumpjeLeft = { left: 200, top: 0 }
            } else if (direction == "down") {
                selectedWumpjeLeft = { left: 0, top: 220 }
                newWumpjeLeft = { left: 0, top: -220 }
            }

            gsap.killTweensOf(".wurmpje-window .selected-wurmpje")
            gsap.killTweensOf(".wurmpje-window .new-wurmpje")
            
            
            gsap.set(".wurmpje-window .selected-wurmpje", {left: 0, top: 0})
            gsap.to(".wurmpje-window .selected-wurmpje", { ...selectedWumpjeLeft, duration: 1, ease: "power1.inOut", onComplete: () => {
                this.updateSelectedIdentity()
                setTimeout(() => {
                    gsap.set(".wurmpje-window .selected-wurmpje", {left: 0, top: 0})
                }, 2000)
            }})
            
            gsap.set(".wurmpje-window .new-wurmpje", {...newWumpjeLeft})
            gsap.to(".wurmpje-window .new-wurmpje", {left: 0, top: 0, duration: 1, ease: "power1.inOut", onComplete: () => {
                setTimeout(() => {
                    gsap.set(".wurmpje-window .new-wurmpje", {left: 200, top: 0})
                }, 2000)
            }})
        },
        
        selectPreviousIdentity() {
            if (!this.selectedIdentity) {
                return
            }
            let newIndex = this.currentIndex - 1
            if (newIndex < 0) {
                newIndex = this.allIdentityOptions.length - 1
            }
            this.currentIndex = newIndex
            this.updateNewIdentity(newIndex)

            this.switchIdentity("left")
        },
        selectNextIdentity() {
            if (!this.selectedIdentity) {
                return
            }
            let newIndex = this.currentIndex + 1
            if (newIndex >= this.allIdentityOptions.length) {
                newIndex = 0
            }
            this.currentIndex = newIndex

            // Do the animation
            this.updateNewIdentity(newIndex)
            this.switchIdentity("right")
            
        },
        parseIdentity(identity: DBIdentity): currentIdentity {
            if (!identity) {
                return undefined
            }

            return {
                id: identity.id,
                name: identity.name,
                gender: identity.gender,
                primaryColor: ColorScheme[identity.colorSchemeIndex].colors[0],
                secondaryColor: ColorScheme[identity.colorSchemeIndex].colors[1],
                offset: identity.offset,
                texture: Textures[identity.textureIndex],
                origin: identity.origin,
                created: identity.created,
                age: this.identityStore.calculateAgeInDays(identity.created, identity.death),
                death: identity.death,
                cooldown: identity.cooldown,
                textureIndex: identity.textureIndex,
                colorSchemeIndex: identity.colorSchemeIndex,
                length: identity.length,
                thickness: identity.thickness,
                hunger: identity.hunger,
                joy: identity.joy,
                love: identity.love,
            }
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
        async submit() {
            this.identityStore.selectIdentity(this.selectedIdentity.id)
            this.$emit("submit")
            
            this.closeModal()
        },
    }
})

</script>

<style>
.select-identity-modal {
    .modal-content {
        max-width: 360px;
    }

    .wurmpje-thumbnail{
        width: 200px;
        height: 100px;
        canvas {
            width: 100%;
        }
    }
}
.selected-identity-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .jao-icon {
        width: 34px;
        margin-top: calc(100px / 2 - 34px / 2);
    }

    .wurmpje-window {
        overflow: hidden;
        height: 220px;
        width: 200px;
        text-align: center;
        position: relative;

        .stats {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .healthbar-row {
            display: grid;
            grid-template-columns: 1fr 40px;
            
            .healthbar {
                height: 10px;
            }

            .healthbar-name {
                font-family: var(--accent-font);
                font-size: 10px;
                text-align: right;
                line-height: 1;
            }
        }
    }
    
    .new-wurmpje, .selected-wurmpje {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
    }

    .new-wurmpje {
        left: 200px;
    }

    .wurmpje-name {
        font-size: 24px;
        font-family: var(--accent-font);
        line-height: 24px;
        margin: 8px 0 12px;
    }
}
    
.select-identity-container {
    .parents {
        margin-top: 16px;
    }

    .parents, table {
        width: 100%;
    }

    .parent-gender {
        text-align: center;
        margin: 0;
        font-family: var(--default-font);
        font-size: 16px;
    }
    
    .parent-name {    
        text-align: center;
        margin: 4px 0;
        font-family: var(--accent-font);
        font-size: 12px;
        font-weight: 300;
    }

    .parent-select {
        text-align: center;
    }

    .wurmpje-thumbnail {
        width: 100%;
    }
    /* .wurmpje-window-animation-helper {
        width: 200%;
        display: flex;
        flex-flow: row nowrap;
    } */
}

</style>