<template>
    <div class="home">
        <favicon class="thumbnail-helper" v-if="identity.current" :identity="identity.current"/>
        <matter-box class="matter-box" v-if="identity.current" :identity="identity.current"/>
        <invalid-parent-id-modal :is-open="invalidParentId" @close-immediate="invalidParentId = false"/>

    </div>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import useIdentityStore from "@/stores/identity"
import Identity from "@/models/identity";
import matterBox from "@/components/matter-box.vue";
import Favicon from "@/components/favicon.vue";
import invalidParentIdModal from "@/modals/invalid-parent-id.vue";
import InvalidParentId from "@/modals/invalid-parent-id.vue";

export default defineComponent ({ 
    name: "homePage",
    components: { 
        matterBox,
        Favicon,
        invalidParentIdModal
    },
    props: [],
    setup() {
        try {
            const identityStore = useIdentityStore()
            
            return {
                identity: identityStore
            }
        } catch (e) {
            console.error("Failed to initialise identity store:", e)
        }
    },
    data() {
        return {
            invalidParentId: false
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

        this.checkForParentInUrl()

        if (!this.identity.current) {
            console.warn("No identity found, redirecting to setup page.")
            this.$router.push({ name: "setup" })
            return
        }
    },
    methods: {
        checkForParentInUrl() {
            const queryString = this.$route.query.parent as string | undefined
            console.log("Query string:", queryString)
            if (!queryString) {
                return
            }
            const identity = new Identity()

            try {
                identity.validateIdentityString(queryString)
            } catch (e) {
                console.warn("Invalid parent identity in URL:", e)
                this.invalidParentId = true
                return
            }

            const parentIdentity = identity.decode(queryString)
            
            if (!parentIdentity) {
                return
            }

            
            this.identity.saveIdentityToDatabase(parentIdentity, {
                origin: "parent",
                selectable: false,
                cooldownDays: 0
            })

            // Remove the parent query parameter from the URL
            this.$router.replace({ 
                name: this.$route.name || "home",
                query: {}
            })
        }
    }
})

</script>

<style>
.matter-box {
    width: 100%;
    height: calc(100vh - 80px);
}

</style>