import gsap from "gsap"
import Story from "@/stories/_base"
import type { currentIdentity } from "@/stores/identity"

class MissedYouStory extends Story {
    type = "passive" as const
    identity = undefined as currentIdentity | undefined
    howBad = 0

    async start() {
        console.info("📖 Missed You story started", this.identityStore)
        
        this.identity = this.identityStore.current

        await this.checkAbsence()
        this.processHowBad()
        
        setTimeout(() => {
            this.storyStore.killStory("missed-you")
        }, 10000)
    }

    async checkAbsence() {
        let amountOfHoursWithoutPresence = 0

        const lastActions = await this.actionStore.loadLastActionsFromDB(this.identity.id, "missed-you-presence", 1)
        const lastAction = lastActions[0]
        const wurmpje = await this.actionStore.loadWurmpjeById(this.identity.id)

        if (!wurmpje) {
            console.error(new Error("Wurmpje not found"))
        }
        
        if (lastAction && lastAction.created) {
            const now = Date.now()
            const created = lastAction.created
            amountOfHoursWithoutPresence = (now - created) / (1000 * 60 * 60)
        } else if (!lastAction) {
            // No previous missed-you-presence action found, calculate from wurmpje creation
            if (wurmpje && wurmpje.created) {
                const now = Date.now()
                const created = wurmpje.created
                amountOfHoursWithoutPresence = (now - created) / (1000 * 60 * 60)
            }
        }
        console.log("Amount of hours without presence:", amountOfHoursWithoutPresence   )

        let loveSubtraction = 0
        this.howBad = 0
        if (amountOfHoursWithoutPresence > 72) {
            loveSubtraction = 48
            this.howBad = 3
        } else if (amountOfHoursWithoutPresence > 48) {
            loveSubtraction = 32
            this.howBad = 2
        } else if (amountOfHoursWithoutPresence > 24) {
            loveSubtraction = 16
            this.howBad = 1
        } 
        
        wurmpje.love -= loveSubtraction
        gsap.to(this.identityStore.current, {
            love: wurmpje.love,
            duration: 1,
            ease: "power4.out",
        })
        
        
        
        if (this.actionStore.db) {
            // Add missed-you-presence action
            await this.actionStore.add(this.identity.id, "missed-you-presence", Date.now())
            // No need to add love action if no love was lost
            if (loveSubtraction == 0) {
                return
            }
            await this.actionStore.add(this.identity.id,"love", -loveSubtraction)
            await this.identityStore.updateIdentityInDatabase(this.identity.id, { love: wurmpje.love })
        }
        
    }
    
    processHowBad() {
        const catterpillar = this.controller.catterpillar
        console.log("Missed You how bad:", this.howBad, catterpillar)
        if (!catterpillar) {
            return
        }
        if (this.howBad == 0) {
            return
        }
        const texts: string[] = []

        if (this.howBad == 1) {
            texts.push(...[
                "I've missed you, where have you been?",
                "I was so lonely without you!",
            ])
        }

        if (this.howBad == 2) {
            texts.push(...[
                "Where have you been? I missed you so much...",
                "I was so lonely without you...",
            ])
        }


        if (this.howBad == 3) {
            texts.push(...[
                `Hi, my name is ${this.identityStore.current.name}, just in case you forgot...`,
                "Please don't you ever leave me alone again for so long...",
                "It is so dark here without you...",
            ])   
        }



        catterpillar.emote("sad")
        catterpillar.say(texts[Math.floor(Math.random() * texts.length)])
    }
    
    destroy = () => {
        super.destroy()
        this.controller.catterpillar.emote(this.controller.catterpillar.defaultState)
        if (this.controller.catterpillar.speechBubble) {
            this.controller.catterpillar.speechBubble.destroy()
        }
        this.controller = undefined
        console.info("📕 Missed You story finished", this.identityStore)
    }
}

export default MissedYouStory