<template>
    <div class="setup">
        <p>
            Wurmpje is currently only invite-only. 
            You can request an invitation link by leaving your e-mailaddress below,
            or you can ask for a qr-code via the wurmpje of a friend to breed your own wurmpje together.
        </p>
        <form @submit="subscribe($event)">
            <input type="email" v-model="email" />
            <button class="button">submit</button>
        </form>
    </div>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import useIdentityStore from "@/stores/identity"
import matterBox from "@/components/matter-box.vue";
import Favicon from "@/components/favicon.vue";

export default defineComponent ({ 
    name: "setupPage",
    components: { 
        matterBox,
        Favicon
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
            error: ""
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
        subscribe(event: Event) {
            event.preventDefault()

            fetch(`${import.meta.env.VITE_PAYLOAD_REST_ENDPOINT}/newsletter-subscriptions`, { 
                method: "POST",
                headers: { 
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    email: this.email,
                    source: "Wurmpje"
                })
            }).then( response => {
                if (!response.ok) {
                    this.error = "Failed to subscribe cause of technical issues."
                } else {
                    this.email = ""
                    this.success = "I'll do my best to send you an invitation link as soon as I can!"
                }
            }).catch(error => {
                this.error = "Failed to subscribe cause of technical issues."
            })
        }
    }
})

</script>

<style>

</style>