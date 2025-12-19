<template>
    <div class="setup">
        <Modal v-if="showModal" :is-open="showModal" :auto-close="false" @close="closeModal" @close-immediate="closeModalImmediate" @submit="subscribe()">
            
            <template #title>
                <h2>Welcome</h2>
            </template>
            <p>
                Wurmpje is currently invite-only. 
                You can request an invitation by leaving your e-mailaddress below.
                You can also try to breed your own wurmpje via a qr-code.
            </p>

            <form @submit.prevent="subscribe()" class="form" id="submit-email-form">
                <div class="row">
                    <i class="icon">
                        <jao-icon name="mail" size="large" inactive-color="transparent" activeColor="var(--bg-color)" />
                    </i>
                    <input type="email" id="email" class="input large" v-model="email" />
                </div>
                <!-- <button class="button">submit</button> -->
            </form>

            <template #submit-text>
                Request invitation
            </template>
        </Modal>

        
        <section v-if="showContent" class="site-container">
            <section v-if="!success">
                <h1>Nothing to see here</h1>
                <p>
                    You didn't thought it was a cookie banner, did you? <br>
                    Would you like to re-open the invitation modal, <br> or do you want to scan a QR code? <br>
                    <br>
                </p>
                <button class="button dark" @click="openModal()">Re-open invitation modal</button>
            </section>

            <section class="subscribed" v-if="success">
                <h1>Thank you for your interest!</h1>
                <p>
                    I'll do my best to send you an invitation link as soon as I can! <br><br>
                    In the meantime, you can try to scan a QR code to see if you can find a wurmpje in there.
                </p>
            </section>


            <router-link to="/scan" class="scan-qr">
                <jaoIcon name="camera" size="large" inactive-color="transparent" activeColor="var(--contrast-color)"/>
                <figcaption>
                    Click on the camera search for a wurmpje in a QR code
                </figcaption>
            </router-link>
        </section>
    </div>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import useIdentityStore from "@/stores/identity"
import matterBox from "@/components/matter-box.vue";
import Favicon from "@/components/favicon.vue";
import Modal from "@/components/modal.vue";
import jaoIcon from "@/components/jao-icon.vue";
import gsap from "gsap";

export default defineComponent ({ 
    name: "setupPage",
    components: { 
        matterBox,
        Favicon,
        Modal,
        jaoIcon
    },
    props: [],
    setup() {
        try {

            const identityStore = useIdentityStore()
            identityStore.init()
            
            return {
                identity: identityStore
            }
        } catch (e) {
            console.error("Failed to initialise identity store:", e)
        }
    },
    data() {
        return {
            email: "",
            success: "",
            error: "",
            showModal: true,
            showContent: false
            
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

    },
    methods: {
        closeModalImmediate(fn?: () => void) {
            this.showContent = true
            setTimeout(() => {
                gsap.to(".site-container", {duration: 0.6, opacity: 1, onComplete: () => {
                    if (fn) {
                        fn()
                    }   
                }})
            })
        },
        closeModal() {
            this.showModal = false
        },
        openModal() {
            // This timeout is needed to force a reset of the modal component
            this.showModal = false
            setTimeout(() => {
                this.showModal = true
            }, 0)
        },
        subscribe() {
            this.closeModalImmediate()
            fetch(`${import.meta.env.VITE_PAYLOAD_REST_ENDPOINT}/newsletter-subscriptions`, { 
                method: "POST",
                headers: { 
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    email: this.email.toLowerCase(),
                    source: "Wurmpje"
                })
            }).then( response => {
                if (!response.ok) {
                    this.error = "Failed to subscribe cause of technical issues."
                } else {
                    this.email = ""
                    this.success = "I'll do my best to send you an invitation link as soon as I can!"
                    this.closeModal()
                }
            }).catch(error => {
                this.error = "Failed to subscribe cause of technical issues."
            })
        }
    }
})

</script>

<style>
.setup .modal-content {
    max-width: 400px;

    p {
        margin-bottom: 16px;
    }
}


.setup .subscribed {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    text-align: center;
    flex-flow: column;
}

.setup .site-container {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    width: 100%;
    min-height: 100vh;
    flex-flow: column;
    opacity: 0;
    gap: 48px;
}

.setup .scan-qr {
    width: 256px;
    margin: 16px 0 0;
    text-align: center;
    color: var(--contrast-color);
    text-decoration: none;

    svg {
        margin: auto;
        max-width: 77.7%;
        margin-bottom: 16px;
    }

    figcaption {
        font-family: var(--accent-font);
        font-size: 14px;
    }
}

</style>