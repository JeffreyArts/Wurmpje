<template>
    <div class="setup">
        <Modal v-if="showModal" :is-open="showModal" :auto-close="false" @close="closeModal" @submit="subscribe()">
            
            <template #title>
                <h2>Welcome</h2>
            </template>
            <p>
                Wurmpje is currently invite-only. 
                You can request an invitation by leaving your e-mailaddress below.
                You can also try to breed your own wurmpje via a qr-code.
            </p>

            <form @submit.prevent="subscribe()">
                <div class="row">
                    <i class="icon">
                        <jao-icon name="mail" size="large" inactive-color="transparent" activeColor="var(--bg-color)" @click="closeModal" />
                    </i>
                    <input type="email" id="email" class="input large" v-model="email" />
                </div>
                <!-- <button class="button">submit</button> -->
            </form>

            <template #submit-text>
                Request invitation
            </template>
        </Modal>


        <section class="subscribed" v-if="success">
            <h1>Thank you for your interest!</h1>
            <p>
                I'll do my best to send you an invitation link as soon as I can!
            </p>
        </section>
        
        <section v-if="!showModal && !success" class="no-nothing">
            <h1>Nothing to see here</h1>
            <p>
                You didn't thought it was a cookie banner, did you? <br>
                Would you like to re-open the invitation modal, <br> or do you want to scan a QR code? <br>
                <br>
            </p>
            <button class="button dark" @click="showModal = true">Re-open invitation modal</button>

            <br><br><br>

            <figure class="scan-qr">
                <jaoIcon name="camera" size="large" inactive-color="transparent" activeColor="var(--contrast-color)"/>
                <figcaption>
                    Click on the camera and try to scan a QR code to breed your own wurmpje
                </figcaption>
            </figure>
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
        closeModal() {
            this.showModal = false
            setTimeout(() => {  
                gsap.to(".no-nothing", {duration: 0.3, opacity: 1})
            })
        },
        subscribe() {
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

    .row {
        gap: 0;
    }

    p {
        margin-bottom: 16px;
    }
}

.icon {
    display: inline-block;
    aspect-ratio: 1;
    height: 44px;
    background-color: var(--contrast-color);
    padding: 8px;
}

.setup .subscribed {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-height: 100vh;
    text-align: center;
    flex-flow: column;
}

.setup .no-nothing {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    width: 100%;
    min-height: 100vh;
    flex-flow: column;
    opacity: 0;
}

.scan-qr {
    width: 256px;
    margin: 16px 0 0;
    text-align: center;

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