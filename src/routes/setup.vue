<template>
    <div class="setup">
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

        <requestInvitationModal :is-open="showModal" @close-immediate="closeModalImmediate" @submit="subscribe" @close="closeModal"/>
    </div>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import useIdentityStore from "@/stores/identity"
import matterBox from "@/components/matter-box.vue";
import Favicon from "@/components/favicon.vue";
import requestInvitationModal from "@/modals/request-invitation.vue";
import jaoIcon from "@/components/jao-icon.vue";
import gsap from "gsap";

export default defineComponent ({ 
    name: "setupPage",
    components: { 
        matterBox,
        Favicon,
        requestInvitationModal,
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
        closeModalImmediate() {
            this.showContent = true
            setTimeout(() => {
                gsap.to(".site-container", {duration: 0.6, opacity: 1})
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