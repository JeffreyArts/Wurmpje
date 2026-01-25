import gsap from "gsap"
import Story from "@/stories/_base"


class DailyHungerUpdateStory extends Story {
    type = "passive" as const
    
    async start() {
        console.info("🦩 Daily Hunger Update story started")

        await this.updateHunger()

        this.storyStore.killStory("daily-hunger-update")
    }

    async updateHunger() {
        let amountOfHoursWithoutFood = 0
        const lastActions = await this.actionStore.loadLastActionsFromDB( this.identityStore.current.id, "hungerLoss", 1)
        const lastAction = lastActions[0]
        const wurmpje = await this.actionStore.loadWurmpjeById( this.identityStore.current.id)

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
            await this.actionStore.add( this.identityStore.current.id,"food", -hungerSubtraction)
            await this.actionStore.add( this.identityStore.current.id,"hungerLoss", hungerSubtraction)
            await this.identityStore.updateIdentityInDatabase(this.identityStore.current.id, { hunger: wurmpje.hunger })
        }
        
    }
    

    destroy = () => {
        console.info("📕 Daily Hunger Update story finished")

        // Process the default story destroy
        super.destroy()
    }
}

export default DailyHungerUpdateStory