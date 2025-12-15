<template>
    <div class="scan-page">
        <div class="loader">
            <jao-icon name="heart" id="loader" size="medium" inactive-color="transparent" active-color="var(--contrast-color)"/>
        </div>

        <div class="qr-scanner-container">
            <video id="qr-scanner"></video>
        </div>

        <span class="story-line-messages">
            <span class="story-line-message" :style="{
                left: message.x + 'px',
                top: message.y + 'px',
                width: message.width + 'px',
                rotate: message.rotation + 'rad',
            }">
                {{ message.text }}
            </span>
        </span>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import useIdentityStore from "@/stores/identity"
import matterBox from "@/components/matter-box.vue"
import Favicon from "@/components/favicon.vue"
// import Modal from "@/components/modal.vue"
import jaoIcon from "@/components/jao-icon.vue"
import gsap from "gsap"
import QrScanner from "qr-scanner"

export default defineComponent({
    name: "setupPage",
    components: {
        matterBox,
        Favicon,
        // Modal,
        jaoIcon,
    },
    props: [],
    setup() {
        try {
            const identityStore = useIdentityStore()
            identityStore.init()

            return {
                identity: identityStore,
            }
        } catch (e) {
            console.error("Failed to initialise identity store:", e)
        }
    },
    data() {
        return {
            message: {
                x: 0,
                y: 0,
                text: "",
                width: 0 as number | string,
                rotation: 0,
            },
            qrScanner: null as QrScanner | null,
            lastScans: [] as Array<{timestamp: number; data: string}>,
            readyForNextScan: true,
            scanStories: [
                [
                    "Hey! I see something",
                    "Try to center the QR code in the camera view.",
                ],
                [
                    "Getting closer!",
                    "Make sure there's enough light and hold your device steady.",
                ],
                [
                    "Hmmmm...",
                    "Let's have another look",
                    "Keep it steady, we're almost ready.",
                    "Almost there!",
                ],
                [
                    "Hold on tight!",
                    "Don't move too fast, we need a clear view.",
                    "That's it, just a bit more...",
                ],
                [
                    "Nice work!",
                    "You're doing great, just a bit closer..."
                ],
                [
                    "Focus mode activated",
                    "💮🧘‍♀️💮",
                    "Slowly...",
                    "Almost there..."
                ],
                [
                    "Getting a clear shot",
                    "Steady now, you’ve got this!",
                    "Patience.. it's almost perfect."
                ],
                [
                    "I think I saw one!",
                ],
                [
                    "Hmmmm... Let's focus",
                    "A little bit more",
                    "A bit more...",
                ],
            ] as Array<Array<string>>,
            successLines: [
                "🔥🔥🔥",
                "💪🐛",
                "Found one!",
                "I found one!",
                "YEAH!! I found one!",
            ] as Array<string>,
            failureLines: [
                "Nope",
                "Maybe try a different code?",
                "Can't find one here",
                "Sorry, no wurmpje here",
                "Can't find a wurmpje here",
                "🙂‍↔️",
            ] as Array<string>,
            storyLine: [] as Array<string>,
            storyLineIndex: 0,
        }
    },
    head: {
        title: "Scan QR Code",
        meta: [
            {
                name: "description",
                content:
                    "Scan a QR code to breed your own Wurmpje, your personal digital pet!",
            },
        ],
    },
    async mounted() {
        this.beatingHeart()
        this.storyLine = this.scanStories[ Math.floor(Math.random() * this.scanStories.length) ]

        // await this.identity.initialised

        const videoEl = document.getElementById(
            "qr-scanner",
        ) as HTMLVideoElement
        this.qrScanner = new QrScanner(
            videoEl,
            this.onScan,
            {
                maxScansPerSecond: 8,
                highlightScanRegion: true,
                highlightCodeOutline: true,
                calculateScanRegion: () => {
                    const video = this.$el.querySelector('#qr-scanner') as HTMLVideoElement;

                    if (!video.videoWidth || !video.videoHeight) {
                        return {
                            x: 0,
                            y: 0,
                            width: 1,
                            height: 1,
                        };
                    }

                    const size = Math.min(video.videoWidth, video.videoHeight);

                    return {
                        x: (video.videoWidth - size) / 2,
                        y: (video.videoHeight - size) / 2,
                        width: size,
                        height: size,
                    };
                },
                /* your options or returnDetailedScanResult: true if you're not specifying any other options */
            },
        )

        // Kill hear tween
        this.qrScanner.start();
        setTimeout(() => {
            gsap.killTweensOf(this.$el.querySelector("#loader"))
            // gsap.killTweensOf(this.$el.querySelector("#loader"));
            gsap.to(this.$el.querySelector("#loader"), {duration: 0.3, opacity: 0});
            gsap.to(this.$el.querySelector("#qr-scanner"), {duration: 0.3, opacity: 1});
        }, 2000)
    },
    methods: {
        beatingHeart() {
            const heart = this.$el.querySelector("#loader")
            if (heart) {
                gsap.fromTo(
                    heart,
                    { scale: 1 },
                    {
                        scale: 1.44,
                        duration: 0.8,
                        yoyo: true,
                        repeat: -1,
                        ease: "elastic.out(1, 0.3)",
                    },
                )
            }
        },
        calculateDimensions(cornerPoints: Array<{x: number, y: number}>) {
            if (cornerPoints.length < 4) {
                return { width: 0, height: 0 }
            }

            const qrScannerEl = this.$el.querySelector("#qr-scanner") as HTMLVideoElement
            const scanRegionHighlightEl = this.$el.querySelector(".scan-region-highlight-svg") as SVGElement
            

            const canvasWidth = scanRegionHighlightEl.clientWidth
            const canvasHeight = scanRegionHighlightEl.clientHeight
            
            const resizedPoints = cornerPoints.map(point => ({
                x: point.x - (qrScannerEl.videoWidth - qrScannerEl.videoHeight) / 2,
                y: point.y ,
            }))


            let width = 0
            {
                const dx = cornerPoints[1].x - cornerPoints[0].x
                const dy = cornerPoints[1].y - cornerPoints[0].y
                width = Math.abs(Math.sqrt(dx*dx + dy*dy))
            }

            let height = 0
            {
                const dx = cornerPoints[3].x - cornerPoints[0].x
                const dy = cornerPoints[3].y - cornerPoints[0].y
                height = Math.abs(Math.sqrt(dx*dx + dy*dy))
            }

            let rotation = 0
            {
                const dx = resizedPoints[1].x - resizedPoints[0].x
                const dy = resizedPoints[1].y - resizedPoints[0].y
                rotation = Math.atan2(dy, dx)
            }

            const x = resizedPoints.reduce((sum, p) => sum + p.x, 0) / resizedPoints.length
            const y = resizedPoints.reduce((sum, p) => sum + p.y, 0) / resizedPoints.length

            return { 
                width, 
                height,
                rotation,
                x,
                y
            }
        },
        onScan(result: {data: string, cornerPoints: Array<{x: number, y: number}>}) {
            const { data, cornerPoints } = result




            const dimensions = this.calculateDimensions(cornerPoints)


            if (!this.readyForNextScan) {
                return
            }

            if (data) {
                this.lastScans.push({ timestamp: Date.now(), data: "scanned data" })
            }
            
            // Check if last 4 scans happened within 3 seconds and are the same
            const recentScans = this.lastScans.filter(
                (scan) => Date.now() - scan.timestamp < 3000,
            )
            const allSame = recentScans.every(
                (scan) => scan.data === recentScans[0].data,
            )
            
            
            if (recentScans.length >= 2 && allSame) {
                
                this.message =  {
                    x: dimensions.x,
                    y: dimensions.y,
                    text: this.storyLine[this.storyLineIndex],
                    width: dimensions.width,
                    // height: dimensions.height,
                    rotation: dimensions.rotation,
                }
                this.readyForNextScan = false

                gsap.to(".qr-scanner-container", {
                    duration: 1,
                    delay: 0,
                    opacity: 0,
                    repeat: 1,
                    yoyo: true
                })

                 gsap.to(".story-line-message", {
                    duration: 0.4, 
                    opacity: 1, 
                    y: 0,
                    // scale: 1,
                    ease: "elastic.out(1.7)",
                    onComplete: () => {
                        setTimeout(() => {
                            this.readyForNextScan = true
                            this.storyLineIndex++
                            if (this.storyLineIndex >= this.storyLine.length) {
                                // Parse data for Identity code
                                this.readyForNextScan = false
                                this.endScan(Math.random() < 0.5)
                            }
                        }, 2000)
                    }
                })                
            }
        },
        endScan(success: boolean) {
            if (this.qrScanner) {
                this.qrScanner.stop()
            }
            const qrScannerEl = this.$el.querySelector("#qr-scanner") as HTMLVideoElement
            const scanRegionHighlightEl = this.$el.querySelector(".scan-region-highlight-svg") as SVGElement
            const x = (qrScannerEl.videoWidth - qrScannerEl.videoHeight) / 2
            const y = (qrScannerEl.videoHeight) / 2
            // Navigate to next page
            if (success) {
                this.message.text = this.successLines[Math.floor(Math.random() * this.successLines.length)]
            } else {
                this.message.text = this.failureLines[Math.floor(Math.random() * this.failureLines.length)]
            }
            this.message.x = x
            this.message.y = y
            this.message.width = "auto"
            this.message.rotation = -.06 - Math.random() * 0.01
            // if (success) {
            //     this.$router.push({ name: "setup" })
            // } else {
            //     this.$router.push({ name: "home" })
            // }
        },
    },
})
</script>

<style>
.qr-scanner-container {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
}

.scan-page #qr-scanner {
    /* pointer-events: none; */
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
}

.scan-page .loader {
    position: fixed;
    left: 50%;
    translate: -50% -50%;
    top: 50%;
    width: 128px;
    z-index: 1;
}

.scan-region-highlight-svg {
    /* display: none; */
}

.story-line-messages {
    position: fixed;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    text-align: center;
    z-index: 10;
    scale: -1 1;
    height: 100%;
    width: 100%;
    max-height: 100vh;
    max-width: 100vh;
    aspect-ratio: 1;
}

.story-line-message {
    position: absolute;
    color: var(--bg-color);
    background-color: var(--contrast-color);
    padding: 8px 32px 10px;   
    font-size: 18px;
    line-height: 1.2;
    font-family: var(--accent-font);
    translate: -50% -50%;
    scale: -1 1;
    opacity: 0;
    width: auto !important;
    translate: 0 8px;
}
.scan-region-highlight {
    opacity: 0 !important;
}
</style>
