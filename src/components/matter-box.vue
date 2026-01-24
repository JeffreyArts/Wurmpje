<template>
    
    <div id="catterpillar-container">
        
        <router-link class="qr" to="/qr" v-if="!identity.death">
            <jao-icon name="qr" size="large" active-color="currentColor" inactive-color="transparent" />
        </router-link>
        
        <!-- Name tag -->
        <header v-if="identity && identity.name" class="catterpillar-header">
            <h1 class="catterpillar-name">
                <i class="catterpillar-gender" :class="identity.gender === 0 ? '__isMale' : '__isFemale'">
                    <jao-icon :name="identity.gender === 0 ? 'male' : 'female'" size="large" active-color="currentColor" inactive-color="transparent"/>
                </i>
                <span>
                    {{ identity.name }}
                </span>

                <span class="catterpillar-switch" @click="showSelectIdentityModalClick()">
                    <jao-icon name="switch" size="large" inactive-color="transparent"/>
                </span>
            </h1>
            <span class="catterpillar-header-footer">
                <span class="catterpillar-age">
                    {{ age }}
                </span>
            </span>
        </header>
        
        <!-- Matter container -->
        <section id="catterpillar" ref="catterpillar"></section>
        
        
        <!-- Footer -->
        <footer class="matterbox-footer" ref="matterbox-footer">
            <div class="actions-container">
                <header class="actions-header" :class="{'__isActive': actionStore.isSelected, '__isDisabled': availableActions <= 0 }">
                    {{availableActions}}x
                </header>
                <section>
                    <jao-icon name="chevron-left" class="prev-action" size="small" active-color="#666666" inactive-color="#fafafa" @click="prevAction" :class="{'__isDisabled': actionStore.isSelected }"/>
                    <div class="action-container" :class="{'__isActive': actionStore.isSelected, '__isDisabled': availableActions <= 0  }" @click="actionContainerClicked">
                        <jao-icon :name="actionIcon" size="large" active-color="currentColor" inactive-color="#fafafa" :transit-effect="iconTransitEffect"/>
                    </div>
                    <jao-icon name="chevron-right" class="next-action" size="small" active-color="#666666" inactive-color="#fafafa" @click="nextAction" :class="{'__isDisabled': actionStore.isSelected }"/>
                </section>
                <footer class="actions-footer" :class="{'__isDisabled': availableActions <= 0 }">
                    {{actionStore.activeAction}}
                </footer>
            </div>
            <div class="stats">
                <div class="healthbar-row" v-if="identity" :class="[actionStore.activeAction == 'Catapult' ? '__isActive' : '']">
                    <healthbar :value="identity.joy" />
                    <span class="healthbar-name">joy</span>
                </div>
                <div class="healthbar-row" v-if="identity" :class="[actionStore.activeAction == 'Words of affirmation' ? '__isActive' : '']">
                    <healthbar :value="identity.love" />
                    <span class="healthbar-name">love</span>
                </div>
                <div class="healthbar-row" v-if="identity" :class="[actionStore.activeAction == 'Food' ? '__isActive' : '']">
                    <healthbar :value="identity.hunger" />
                    <span class="healthbar-name">hunger</span>
                </div>
                <span class="copyright">
                    A project by <a href="https://www.jeffreyarts.nl">Jeffrey Arts</a>
                </span>
            </div>
        </footer>

        <select-identity-modal :is-open="showSelectIdentityModal" @close="showSelectIdentityModal = false" @submit="start"/>
    </div>
</template>



<script lang="ts">
import {defineComponent, type PropType} from "vue"
import { MatterController } from "@/tamagotchi/controller"
import useIdentityStore, { type currentIdentity} from "@/stores/identity"
import { gsap } from "gsap"
import _ from "lodash"
import jaoIcon from "./jao-icon.vue"
import { Icon } from "jao-icons"
import healthbar from "@/components/healthbar.vue";
import useActionStore, { type actionTypes } from "@/stores/action";
import useStoryStore from "@/stores/story";
import selectIdentityModal from "@/modals/select-identity.vue";

export default defineComponent ({ 
    props: {
        identity: {
            type: Object as PropType<currentIdentity>,
                required: true
            }
        },
        components: {
            jaoIcon,
            healthbar,
            selectIdentityModal
        },
        data() {
            return {
                controller: null as MatterController | null,
                // clickType: null as string | null,
                dev: false,
                action: "food",
                foodQuantity: 0,
                showSelectIdentityModal: false,
                iconTransitEffect: {
                    effect: "right-to-left" as "left-to-right" | "right-to-left" | "top-to-bottom" | "bottom-to-top" | "shuffle",
                    duration: 2,
                    ease: "elastic.out(1,0.5)"
                    
                }
            }
        },
        setup() {
            const identityStore = useIdentityStore()
            const actionStore = useActionStore()
            const storyStore = useStoryStore()
            return {
                identityStore: identityStore,
                actionStore: actionStore,
                storyStore: storyStore
            }
        },
        watch: {
            "identity.defaultState"(newVal, oldVal) {
                if (!newVal) {
                    return
                }
                this.controller.catterpillar.defaultState = newVal
                this.controller.catterpillar.emote(newVal)
            },
            "identity.id"(newVal, oldVal) { 
                if (this.controller) {
                    this.controller.catterpillar.destroy()
                    this.controller.createCatterpillar({ x: this.controller.ref.renderer.options.width / 2, y: this.controller.ref.renderer.options.height - 200 }, { identity: this.identity })  
                    this.loadAction(this.actionStore.activeAction)
                }
            },
            "identity.death"(newVal, oldVal) {
                if (newVal) {
                    this.setDeathState()
                } else {
                    const classes = [".catterpillar-name",
                    ".catterpillar-age",
                    ".speech-bubble",
                    ".matterbox-footer",
                    ".actions-container",
                    ".healthbar-row",
                    "canvas",
                    "#two-js"
                    ]
                    
                    gsap.set(classes.map(c => `#catterpillar-container ${c}`), 
                    { opacity: 1}
                    )
                }
            }
        },
        computed: {
            availableActions(): number {
                return this.actionStore.availableActions
            },
            age(): string {
                if (!this.identity.age) {
                    return "-"
                }
                if (this.identity.age == 1) {
                    return "1 day old"
                }
                if (this.identity.age >= 2) {
                    return `${this.identity.age} days`
                }
            },
            actionIcon(): string {
                switch (this.actionStore.activeAction) {
                    case "Food":
                    return "leaf"
                    case "Words of affirmation":
                    return "thoughts"
                    case "Catapult":
                    return "throw-ball"
                    default:
                    return "question-mark"
                }
            }
        },
        async mounted() {
            
            // let startPosition = { x: this.ref.renderer.options.width / 2, y: this.ref.renderer.options.height - this.config.offsetBottom - catterpillarOptions.identity.thickness }
            const offsetBottom = 128
            const startPosition = { 
                x: window.innerWidth / 2,
                y: window.innerHeight - offsetBottom - this.identity.thickness 
            }
            
            this.controller = new MatterController( this.$refs["catterpillar"] as HTMLElement, {
                identity: this.identity,
                catterpillarPos: startPosition,
                offsetBottom: 128
            })
            
            // Change startPosition if the catterpillar is new, so it falls from the sky
            if (this.identity.age <= 1) {
                startPosition.y = -200
            }

            this.start()
        },
        unmounted() {
            if (this.actionStore.isSelected) {
                this.actionStore.deselectAction()
            }
            
            if (this.controller) {
                this.controller.destroy()
                this.controller = null
            }
        },
        methods: {
            async start() {
                await this.storyStore.initialised
                if (this.identity?.death) {
                    const classes = [".catterpillar-name",
                    ".catterpillar-age",
                    ".speech-bubble",
                    ".matterbox-footer",
                    ".actions-container",
                    ".healthbar-row",
                    "canvas",
                    "#two-js"
                    ]
                    
                    gsap.set(classes.map(c => `#catterpillar-container ${c}`), 
                    { opacity: 0}
                    )
                    return
                }
                
                
                
                if (this.identity.age <= 1) {
                    const ceiling = this.controller.ref.world.bodies.find(b => b.label.split(",").includes("top"))
                    const collisionFilterMask = ceiling.collisionFilter.mask
                    ceiling.collisionFilter.mask = 0
                    setTimeout(() => {
                        ceiling.collisionFilter.mask = collisionFilterMask
                    }, 1600)
                }
                
                this.toggleDevMode()
                this.toggleDevMode()
                
                this.loadAction(this.actionStore.activeAction)
                
                this.storyStore.setActiveStory("wall-slam")
                this.storyStore.setActiveStory("petting")
                this.storyStore.setActiveStory("daily-hunger-update")
                
                await this.storyStore.updateConditionalStories()
                
                // Add conditial story
                const conditionalStory = this.storyStore.conditionalStories[0]
                if (conditionalStory) {
                    this.storyStore.setActiveStory(conditionalStory.name)
                }
            },
            showSelectIdentityModalClick() {
                this.showSelectIdentityModal = true
                // kill all active stories
                this.storyStore.activeStories.forEach(story => {
                    story.instance.destroy()
                })
                this.storyStore.activeStories = []
            },
            hasActiveActionStory() {
                const hasActive = this.storyStore.activeStories.some(story => {
                    return (story.instance.type == "action" && story.name != "eat")
                });
                return hasActive
            },
            nextAction() {
                if (this.hasActiveActionStory()) {
                    return
                }
                if (this.actionStore.isSelected) {
                    return
                }
                this.iconTransitEffect.effect = "right-to-left"
                const index = this.actionStore.possibleActions.indexOf(this.actionStore.activeAction)
                const nextIndex = (index + 1) % this.actionStore.possibleActions.length
                this.actionStore.activeAction = this.actionStore.possibleActions[nextIndex]
                this.loadAction(this.actionStore.activeAction)
            },
            prevAction() {
                if (this.hasActiveActionStory()) {
                    return
                }
                if (this.actionStore.isSelected) {
                    return
                }
                this.iconTransitEffect.effect = "left-to-right"
                const index = this.actionStore.possibleActions.indexOf(this.actionStore.activeAction)
                const prevIndex = index - 1 < 0 ? this.actionStore.possibleActions.length -1 : index - 1
                this.actionStore.activeAction = this.actionStore.possibleActions[prevIndex]
                this.loadAction(this.actionStore.activeAction)
            },
            toggleDevMode() {
                this.dev = !this.dev
                const twoEl = this.$el.querySelector("[id^='two-js']") as HTMLCanvasElement
                const rendererEl = this.$el.querySelector("#matter") as HTMLCanvasElement
                gsap.to(twoEl, {duration: 0.3, opacity: this.dev ? 0 : 1})
                gsap.to(rendererEl, {duration: 0.3, opacity: this.dev ? 1 : 0})
            },
            
            async loadAction(actionType: actionTypes) {
                if (actionType === "Food") {
                    await this.actionStore.loadAvailableFood(this.identity.id)
                } else if (actionType == "Words of affirmation") {
                    await this.actionStore.loadAvailableWOFtries(this.identity.id)
                } else if (actionType == "Catapult") {
                    await this.actionStore.loadAvailableCatapultTries(this.identity.id)
                }
            },
            
            actionContainerClicked() {
                if (this.actionStore.availableActions <= 0 ) {
                    return
                }
                
                if (this.hasActiveActionStory()) {
                    return
                }
                
                this.actionStore.toggleSelected()
                
                // Clicking anywhere outside the action container will deselect the action
                const checkParentHasClass = (el, className) => {
                    if (el.classList && el.classList.contains(className)) {
                        return true
                    }
                    if (el.parentElement) {
                        return checkParentHasClass(el.parentElement, className)
                    }
                    return false
                }
                
                const removeActionActive = (e) => {
                    // Check if any parent element has the class .action-container
                    if (checkParentHasClass(e.target, "action-container")) {
                        return
                    }
                    
                    // Only deselect Food action for now
                    if (this.actionStore.activeAction == "Food") {
                        e.preventDefault()
                        this.actionStore.deselectAction()   
                    }
                    
                    
                    
                    
                    homeFooter.removeEventListener("click", removeActionActive)
                }
                
                const homeFooter = this.$refs["matterbox-footer"] as HTMLElement
                homeFooter.addEventListener("click", removeActionActive, { passive: false })
                
            },
            setDeathState() {
                const el = this.$el
                
                this.controller.catterpillar.isDead = true
                
                gsap.to(el.querySelectorAll("canvas, #two-js"), 
                { duration: 1, filter: "grayscale(100%) blur(2px)", opacity: 0}
                )
                
                gsap.killTweensOf(".speech-bubble")
                gsap.to(".speech-bubble", { duration: 1, opacity: 0, ease: "power2.out" })
                
                gsap.to(el.querySelectorAll(".catterpillar-name, .catterpillar-age, .matterbox-footer, .actions-container, .healthbar-row"), 
                { duration: 1, opacity: 0, stagger: 0.5, ease: "power2.out" }
                )
                // catterpillar-name
                
            }
        }
    })
</script>


<style scoped> 
#catterpillar-container {
    position: relative;
    width: 100%;
    
    > div {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
    }
}

#catterpillar {
    height: 100vh;
    /* pointer-events: none;  NIET DENKEN DAT JE DEZE MOET TOEVOEGEN, FOKT HET OP VOOR MOBIEL*/
}

.catterpillar-header {
    position: absolute;
    top: 0;
    left: 50%;
    translate: -50% 0;
    max-width: 320px;
    text-align: center;
    padding-top: 16px;
    z-index: 1;
    display: inline-block;
}

.catterpillar-name {
    font-size: 24px;
    font-family: var(--accent-font);
    line-height: 24px;
    margin: 0;
}

.catterpillar-age {
    font-size: 16px;
    font-family: var(--accent-font);
    opacity: 0.4;
}

.catterpillar-gender {
    display: inline-block;
    &.__isMale {
        margin-right: 8px;
        svg {
            translate: 0 6px;
        }
    }
    
    &.__isFemale {
        margin-right: 2px;
        svg {
            translate: 0 2px;
        }
    }
    svg {
        display: inline-block;
        height: 23px;
        width: 23px;
    }
}

.button {
    color: #eee;
    background-color: var(--primary-bg-color);
    border: 0 none transparent;
    padding: 8px 16px;
    transition: .16s all ease;
    color: var(--contrast-color);
    
    &:hover {
        filter: brightness(95%);
        cursor: pointer;
        border-radius: 8px;
    }
    
    &.dark {
        background-color: var(--contrast-color);
        color: var(--primary-bg-color);
        border: 1px solid var(--contrast-color);
        &:hover, &:focus {
            background-color: var(--primary-bg-color);
            color: var(--contrast-color);
            cursor: pointer;
            border-radius: 2px;
        }
    }
    
    &.default {
        background-color: #eee;
        color: #222;
        &:hover, &:focus {
            box-shadow: 8px 8px 0 rgba(0,0,0,1);
            cursor: pointer;
            border-radius: 2px;
        }
    }
    
    &.__isSmall {
        padding: 4px 8px;
        font-size: 12px;
    }
    
    &.__isDisabled {
        background-color: var(--red);
        cursor: not-allowed;
        color: var(--primary-bg-color);
    }
    
    &.__isSelected {
        background-color: var(--green);
        color: var(--primary-bg-color);
    }
}

.buttons-container {
    display: flex;
    gap: 8px;
    position: fixed;
    flex-flow: wrap row;
    bottom: 16px;
    left: 16px;
}

#devmode {
    position: fixed;
    bottom: 16px;
    right: 16px;
}


.matterbox-footer {
    position: fixed;
    bottom: 0px;
    left: 0;
    right: 0;
    height: 128px;   
    padding: 0px 16px 8px;
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

.next-action.__isDisabled,
.prev-action.__isDisabled {
    opacity: 0.1;
}

.actions-header {
    opacity: 0.6;
    transition: all .32s ease;
    
    &.__isActive {
        opacity: 1;
    }
    
    &.__isDisabled {
        opacity: 0.4;
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
    
    &.__isDisabled {
        opacity: 0.4;
    }
    
    svg {
        height: 100%;
    }
}

.actions-footer {
    text-align: center;
    height: 32px;
    line-height: 1em;
    
    &.__isDisabled {
        opacity: 0.4;
    }
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
    
    .healthbar {
        transition: scale .32s ease;
        transform-origin: center;
        scale: 1 1;
    }
    
    .healthbar-name {
        transition: opacity .32s ease;
        opacity: 0.64;
    }
    
    &.__isActive {
        .healthbar-name {
            opacity: 1;
        }
        
        .healthbar {
            scale: 1 1.2;
        }
    }
}

.copyright {
    opacity: 0.4;
    text-align: right;
    font-family: var(--default-font);
    letter-spacing: .2px;
    font-size: 10px;
    padding-top: 4px;
}

.qr {
    position: absolute;
    top: 16px;
    left: 16px;
    text-decoration: none;
    z-index: 1;
    color: currentColor;
    
    svg {
        height: 54px;
        width: 54px;
    }
}

.catterpillar-switch {
    position: absolute;
    right: calc(-13px - 8px);

    .jao-icon {
        height: 13px;
        translate: 0 5px;
    }
}
</style>