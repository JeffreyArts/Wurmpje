import gsap from "gsap"
import Story from "@/stories/_base"
import Catterpillar, { type Emote } from "@/models/catterpillar"
import type { currentIdentity } from "@/stores/identity"


class DailyHungerUpdateStory extends Story {
    type = "passive" as const
    identity = undefined as currentIdentity | undefined
    catterpillar = undefined as Catterpillar | undefined
    defaultState = "happy" as Emote
    defaultStateTimeout = undefined as ReturnType<typeof setTimeout> | undefined
    isHurt = false
    
    start() {
        console.info("Daily Hunger Update story started", this.identityStore)
        
        this.identity = this.identityStore.current

        this.updateHunger()
    }

    async updateHunger() {
        let amountOfHoursWithoutFood = 0

        const lastActions = await this.actionStore.loadLastActionsFromDB(this.identity.id, "hungerLoss", 1)
        const lastAction = lastActions[0]
        const wurmpje = await this.actionStore.loadWurmpjeById(this.identity.id)

        if (!wurmpje) {
            console.error(new Error("Wurmpje not found"))
        }
        
        if (lastAction && lastAction.created) {
            const now = Date.now()
            const created = lastAction.created
            amountOfHoursWithoutFood = (now - created) / (1000 * 60 * 60)
        } else if (!lastAction) {
            // No previous hungerLoss action found, calculate from wurmpje creation
            if (wurmpje && wurmpje.created) {
                const now = Date.now()
                const created = wurmpje.created
                amountOfHoursWithoutFood = (now - created) / (1000 * 60 * 60)
            }
        }

        // Lose 19 food per 24 hours, rounded (24 * .75), so dies within ~5 days without food
        const hungerSubtraction = Math.round(amountOfHoursWithoutFood * .75)
        wurmpje.hunger -= hungerSubtraction

        gsap.to(this.identityStore.current, {
            hunger: wurmpje.hunger,
            duration: 1,
            ease: "power4.out",
        })
        
        
        // No need to add action if no hunger was lost
        if (hungerSubtraction == 0) {
            return
        }

        if (this.actionStore.db) {
            this.actionStore.add(this.identity.id,"food", -hungerSubtraction)
            this.actionStore.add(this.identity.id,"hungerLoss", hungerSubtraction)
            this.identityStore.updateIdentityInDatabase(this.identity.id, { hunger: wurmpje.hunger })
        }
        
    }
    

    destroy = () => {
        super.destroy()
    }
}

export default DailyHungerUpdateStory