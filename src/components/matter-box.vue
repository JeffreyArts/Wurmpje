<template>
  
  <div id="catterpillar-container">
    <header v-if="identity && identity.name" class="catterpillar-header">
        <h1 class="catterpillar-name">
            <i class="catterpillar-gender" :class="identity.gender === 0 ? '__isMale' : '__isFemale'">
                <jao-icon :name="identity.gender === 0 ? 'male' : 'female'" size="large" active-color="currentColor" inactive-color="transparent"/>
            </i>
            <span>
                {{ identity.name }}
            </span>
        </h1>
        <span class="catterpillar-age">{{ age }}</span>
    </header>

    <section id="catterpillar" ref="catterpillar"></section>

    <footer class="matterbox-footer" ref="matterbox-footer">
        <div class="actions-container">
            <header class="actions-header" :class="{'__isActive': actionActive, '__isDisabled': actionStore.availableFood <= 0 }">
                {{availableFood}}x
            </header>
            <section>
                <jao-icon name="chevron-left" size="small" active-color="#666666" inactive-color="transparent"/>
                <div class="action-container" :class="{'__isActive': actionActive, '__isDisabled': actionStore.availableFood <= 0  }" @click="actionContainerClicked">
                    <jao-icon name="leaf" size="large" active-color="currentColor" inactive-color="transparent" />
                </div>
                <jao-icon name="chevron-right" size="small" active-color="#666666" inactive-color="transparent"/>
            </section>
            <footer class="actions-footer" :class="{'__isDisabled': actionStore.availableFood <= 0 }">
                Food
            </footer>
        </div>
        <div class="stats">
            <div class="healthbar-row" v-if="identity">
                <healthbar :value="identity.hunger" />
                <span class="healthbar-name">hunger</span>
            </div>
            <span class="copyright">
                A project by <a href="https://www.jeffreyarts.nl">Jeffrey Arts</a>
            </span>
        </div>
    </footer>


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

export default defineComponent ({ 
    props: {
        identity: {
            type: Object as PropType<currentIdentity>,
            required: true
        }
    },
    components: {
        jaoIcon,
        healthbar
    },
    data() {
        return {
            controller: null as MatterController | null,
            clickType: null as string | null,
            dev: false,
            action: "food",
            actionActive: false,
            foodQuantity: 0
        }
    },
    setup() {
        const identityStore = useIdentityStore()
        const actionStore = useActionStore()
        return {
            identityStore: identityStore,
            actionStore: actionStore
        }
    },
    watch: {
        
    },
    computed: {
        availableFood(): number {
            return this.actionStore.availableFood
        },
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
        }
    },
    async mounted() {
        this.controller = new MatterController( this.$refs["catterpillar"] as HTMLElement, {
            identity: this.identity,
            catterpillarPos: { x: window.innerWidth / 2, y: -100},
            offsetBottom: 128
        })

        this.controller.on("foodCreated", (data) => {
            console.log("Food created, remaining:", this.actionStore.availableFood)
            if (this.actionStore.availableFood <= 0) {
                this.actionActive = false
                this.toggleClickTo("none")
            }
        })
    
        this.toggleDevMode()
        this.toggleDevMode()

        this.loadAction("food")

        
        setTimeout(() => {
            this.controller.catterpillar.say(`Hi! My name is: ${this.identity.name}!`)
            setTimeout(() => {
                this.controller.catterpillar.speechBubble.remove()
            }, 7200)
        }, 4000)
    },
    methods: {
        toggleClickTo(type: string) {
            if (type === "food") {
                if (this.actionStore.availableFood <= 0) {
                    return
                }
            }

            this.clickType = type
            this.controller.switchClickEvent(type)
        },

        toggleDevMode() {
            this.dev = !this.dev
            const twoEl = this.$el.querySelector("[id^='two-js']") as HTMLCanvasElement
            const rendererEl = this.$el.querySelector("#matter") as HTMLCanvasElement
            gsap.to(twoEl, {duration: 0.3, opacity: this.dev ? 0 : 1})
            gsap.to(rendererEl, {duration: 0.3, opacity: this.dev ? 1 : 0})
        },
        
        async loadAction(actionType: actionTypes) {
            if (actionType === "food") {
                await this.actionStore.loadAvailableFood(this.identity)
            }
        },

        actionContainerClicked() {
            if (this.actionStore.availableFood <= 0) {
                return
            }

            this.actionActive = !this.actionActive
            if (!this.actionActive) {
                this.toggleClickTo("none")
                return
            } else {
                this.toggleClickTo("food")
            }


            const removeActionActive = (e) => {
                e.preventDefault()
                this.actionActive = false
                homeFooter.removeEventListener("touchstart", removeActionActive)
            }

            const homeFooter = this.$refs["matterbox-footer"] as HTMLElement
            homeFooter.addEventListener("touchstart", removeActionActive, { passive: false })
        }
    }
})
</script>


<style> 

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
    pointer-events: none;
}

.catterpillar-header {
    position: absolute;
    top: 0;
    left: 50%;
    translate: -50% 0;
    max-width: 320px;
    text-align: center;
    padding-top: 16px;
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