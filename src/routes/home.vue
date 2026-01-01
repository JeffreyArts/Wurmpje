<template>
    <div class="home">
        <favicon class="thumbnail-helper" v-if="identity.current" :identity="identity.current"/>
        <matter-box class="matter-box" v-if="identity.current" :identity="identity.current"/>

        <footer class="home-footer" ref="home-footer">
            <div class="actions-container">
                <header class="actions-header" :class="{'__isActive': actionActive }">
                    3x
                </header>
                <section>
                    <jao-icon name="chevron-left" size="small" active-color="#666666" inactive-color="transparent"/>
                    <div class="action-container" :class="{'__isActive': actionActive }" @click="actionContainerClicked">
                        <jao-icon name="leaf" size="large" active-color="currentColor" inactive-color="transparent" />
                    </div>
                    <jao-icon name="chevron-right" size="small" active-color="#666666" inactive-color="transparent"/>
                </section>
                <footer class="actions-footer">
                    Food
                </footer>
            </div>
            <div class="stats">
                <div class="healthbar-row">
                    <healthbar :value="60" />
                    <span class="healthbar-name">hunger</span>
                </div>
                <span class="copyright">
                    A project by <a href="https://www.jeffreyarts.nl">Jeffrey Arts</a>
                </span>
            </div>
        </footer>

        <invalid-parent-id-modal :is-open="invalidParentId" @close-immediate="invalidParentId = false"  @close="removeQueryFromUrl"/>
        <breeding-modal :is-open="showBreedingModal" @close="removeQueryFromUrl" :parent="breedingIdentity"/>

    </div>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import useIdentityStore from "@/stores/identity"
import Identity, {type IdentityField } from "@/models/identity";
import matterBox from "@/components/matter-box.vue";
import Favicon from "@/components/favicon.vue";
import invalidParentIdModal from "@/modals/invalid-parent-id.vue";
import breedingModal from "@/modals/breeding.vue";
import jaoIcon from "@/components/jao-icon.vue";
import { Icon } from "jao-icons"
import healthbar from "@/components/healthbar.vue";

export default defineComponent ({ 
    name: "homePage",
    components: { 
        matterBox,
        Favicon,
        invalidParentIdModal,
        breedingModal,
        jaoIcon,
        healthbar
    },
    props: [],
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
            invalidParentId: false,
            showBreedingModal: false,
            breedingIdentity: null as IdentityField | null,
            action: "food",
            actionActive: false
        }
    },
    computed: {
        actionHeader(): string {
            if (this.action === "food") {
                const container = document.createElement("div")
                const svgNumber = Icon("3", "medium")
                const svgMultiplier = Icon("x", "small")
                container.appendChild(svgNumber)
                container.appendChild(svgMultiplier)
                return container.innerHTML
            }
            return "Feed your Wurmpje"
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

        const foundParent = await this.checkForParentInUrl()

        if (!this.identity.current && !foundParent) {
            console.warn("No identity found, redirecting to setup page.")
            this.$router.push({ name: "setup" })
            return
        }
    },
    methods: {
        async checkForParentInUrl() {
            const queryString = this.$route.query.parent as string | undefined
            const identity = new Identity()

            if (!queryString) {
                return
            }

            try {
                identity.validateIdentityString(queryString)
            } catch (e) {
                console.warn("Invalid parent identity in URL:", e)
                this.invalidParentId = true
                return
            }
            
            
            const parentIdentity = identity.decode(queryString)

            // Invalid parent ID error
            if (!parentIdentity || !parentIdentity.name) {
                console.warn("Invalid parent identity:", parentIdentity)
                this.invalidParentId = true
                return
            }
                        
            const existingIdentity = await this.identity.findIdentityInDatabase("id", parentIdentity.id);
            let storedInDB = undefined;
            // Add identity to database if it doesn't exist
            if (!existingIdentity) {
                try {
                    storedInDB = await this.identity.saveIdentityToDatabase(parentIdentity, {
                        origin: "parent",
                        selectable: false,
                        cooldownDays: 0
                    })
                } catch (e) {
                    console.warn("Invalid parent identity:", e)
                    return
                }
            }

            let breedingIdentity
            if (storedInDB) {
                breedingIdentity = storedInDB
            } else if (existingIdentity) {
                breedingIdentity = existingIdentity
            } else {
                breedingIdentity = parentIdentity
            }



            this.showBreedingModal = true
            this.breedingIdentity = breedingIdentity
            return breedingIdentity
        },
        removeQueryFromUrl() {
            this.showBreedingModal = false
            this.$router.replace({ 
                name: this.$route.name || "home",
                query: {}
            })
        },
        actionContainerClicked() {
            console.log("Action container clicked")
            this.actionActive = !this.actionActive
            if (!this.actionActive) {
                return
            }
            const removeActionActive = (e) => {
                e.preventDefault()
                this.actionActive = false
                homeFooter.removeEventListener("touchstart", removeActionActive)
            }

            const homeFooter = this.$refs["home-footer"] as HTMLElement
            homeFooter.addEventListener("touchstart", removeActionActive, { passive: false })
        }
    },
})

</script>

<style>
.matter-box {
    width: 100%;
    height: calc(100vh - 80px);
}

.home-footer {
    position: fixed;
    bottom: 0px;
    left: 0;
    right: 0;
    height: 128px;   
    padding: 0px 16px 12px;
    display: grid;
    grid-template-columns: 96px auto;
    gap: 16px;
    max-width: 640px;
    margin: auto;
    
    a {
        color: currentColor;
        text-decoration: underline;
    }
}
    
    
.actions-container {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
    flex-flow: column;
    margin: 0;
    font-family: var(--accent-font);

    section {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
    }
}

.actions-header {
    opacity: 0.6;
    transition: all .32s ease;

    &.__isActive {
        opacity: 1;
    }

    svg {
        height: 23px;
        + svg {
            height: 15px;
            opacity: 0.8;
        }
    }
    rect[v="0"] {
        fill: transparent;
    }
}

.action-container {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid transparent;
    border-radius: 0;
    padding: 4px;
    transition: all .32s ease;

    &.__isActive {
        color: #f90;
        /* border-color: currentColor; */
    }

    svg {
        height: 100%;
    }
}
actions-footer {
    align-self: flex-end;
}

.stats {
    display: flex;
    justify-content: flex-end;
    font-family: var(--accent-font);
    font-size: 14px;
    flex-flow: column;
    gap: 8px;
}

.healthbar-row {
    display: grid;
    grid-template-columns: auto 72px;
    text-align: right;
}

.copyright {
    opacity: 0.4;
    text-align: right;
    font-family: var(--default-font);
    letter-spacing: .2px;
    font-size: 10px;
    padding-top: 4px;
}

</style>