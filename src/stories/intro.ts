import { watch } from "vue"
import Story from "@/stories/_base"

class IntroStory extends Story {
    type = "conditional" as const
    priority = "high" as const
    hasIntroducedItself = false
    touchingGroundCounter = 0
    storyIndex: number = 0
    isTalking = false
    cooldown = 360 * 24 * 365 * 100 * 1000 // 100 years
    storyLines = [
        `Hi! My name is: ${this.identityStore.current?.name}!`,
        "I am a wurmpje, a little caterpillar-like creature.",
        "Tap anywhere to continue my story.",
        "I can move around, eat leaves, and grow bigger over time.",
        "Click on the leaf icon at the bottom of the screen to make it orange.",
        "Now tap on the screen to drop some leaves.",
        "Yummy!!!",
        "If you'll take good care of me, I will grow as tall as you one day!",
    ]
    storyLineTimeout = undefined as undefined | ReturnType<typeof setTimeout>
    start() {
        console.info("Intro story started", this.identityStore)

        // Watch for selecting the food action
        watch(() => this.actionStore.isSelected, (isSelected) => {
            if (isSelected && this.actionStore.activeAction == "Food") {
                this.storyIndex = 5
                this.moveToNextStoryLine()
            }
        })

        // Watch for the first food to be dropped
        watch(() => this.actionStore.availableActions, (newFood, oldFood) => {
            if (this.storyIndex != 6) {
                return
            }

            if (newFood < oldFood) {
                this.moveToNextStoryLine()
            }
        })
        
        document.addEventListener("pointerdown", () => {
            if (this.touchingGroundCounter < 80) {
                return
            }

            // if (this.controller?.catterpillar.isTalking) {
            //     return
            // }


            if (this.storyIndex == 5 || this.storyIndex == 6) {
                return
            }
            
            this.moveToNextStoryLine()
        })

        
    }

    async checkCondition() {
        // Check if story is already completed
        const prevStory = await this.storyStore.getLatestDatabaseEntry("intro")

        if (prevStory && typeof prevStory.details.storyIndex == "number" && prevStory.details.storyIndex >= this.storyLines.length) {
            return false
        }

        return true
    }

    loop() {
        // console.log(this.touchingGroundCounter)
        if (this.controller.catterpillar.isOnSolidGround) {
            this.touchingGroundCounter++
        }
        
        // console.log("Touching ground counter:", this.touchingGroundCounter)
        if (this.touchingGroundCounter > 80 && !this.hasIntroducedItself) {
            this.hasIntroducedItself = true
            this.moveToNextStoryLine()
        }
    }
    
    moveToNextStoryLine() {
        clearTimeout(this.storyLineTimeout)
        if (!this.storyLines[this.storyIndex]) {
            this.controller.catterpillar.speechBubble?.destroy()
            // Set story as completed
            this.storyStore.completeStory("intro")
            return
        }
        
        if (this.storyIndex == 2) {
            setTimeout(() => {
                this.controller.catterpillar.move()
            }, 2000)
        }

        if (this.storyIndex == 3) {
            setTimeout(() => {
                this.controller.catterpillar.turnAround()
            }, 3000)
        }
        

        this.controller.catterpillar.say(this.storyLines[this.storyIndex])
        this.storyIndex++
        this.storyStore.updateStoryDetails("intro", { storyIndex: this.storyIndex })
        this.storyLineTimeout = setTimeout(() => {
            this.moveToNextStoryLine() 
        }, 12000)
    }
}

export default IntroStory