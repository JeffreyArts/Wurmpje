<template>
    <div class="home">
        <favicon class="thumbnail-helper" v-if="identity.current" :identity="identity.current"/>
        <matter-box class="matter-box" v-if="identity.current" :identity="identity.current"/>
        <invalid-parent-id-modal :is-open="invalidParentId" @close-immediate="invalidParentId = false"  @close="removeQueryFromUrl"/>
        <breeding-modal :is-open="showBreedingModal" @close="removeQueryFromUrl" :parent="breedingIdentity"/>

    </div>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import useIdentityStore from "@/stores/identity"
import Identity, {type IdentityField } from "@/models/identity";
import matterBox from "@/components/matter-box.vue";
import Favicon from "@/components/favicon.vue";
import invalidParentIdModal from "@/modals/invalid-parent-id.vue";
import breedingModal from "@/modals/breeding.vue";

export default defineComponent ({ 
    name: "homePage",
    components: { 
        matterBox,
        Favicon,
        invalidParentIdModal,
        breedingModal
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
            invalidParentId: false,
            showBreedingModal: false,
            breedingIdentity: null as IdentityField | null
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

        const foundParent = await this.checkForParentInUrl()

        if (!this.identity.current && !foundParent) {
            console.warn("No identity found, redirecting to setup page.")
            this.$router.push({ name: "setup" })
            return
        }
    },
    methods: {
        async checkForParentInUrl() {
            const queryString = this.$route.query.parent as string | undefined
            const identity = new Identity()

            if (!queryString) {
                return
            }

            try {
                identity.validateIdentityString(queryString)
            } catch (e) {
                console.warn("Invalid parent identity in URL:", e)
                this.invalidParentId = true
                return
            }
            
            
            const parentIdentity = identity.decode(queryString)

            // Invalid parent ID error
            if (!parentIdentity || !parentIdentity.name) {
                console.warn("Invalid parent identity:", parentIdentity)
                this.invalidParentId = true
                return
            }
            
            
            const existingIdentity = await this.identity.findIdentityInDatabase("id", parentIdentity.id);
            let storedInDB = undefined;
            // Add identity to database if it doesn't exist
            if (!existingIdentity) {
                try {
                    storedInDB = await this.identity.saveIdentityToDatabase(parentIdentity, {
                        origin: "parent",
                        selectable: false,
                        cooldownDays: 0
                    })
                } catch (e) {
                    console.warn("Invalid parent identity:", e)
                    return
                }
            }

            let breedingIdentity
            if (storedInDB) {
                breedingIdentity = storedInDB
            } else if (existingIdentity) {
                breedingIdentity = existingIdentity
            } else {
                breedingIdentity = parentIdentity
            }



            this.showBreedingModal = true
            this.breedingIdentity = breedingIdentity
            return breedingIdentity
        },
        removeQueryFromUrl() {
            this.$router.replace({ 
                name: this.$route.name || "home",
                query: {}
            })
        }
    },
})

</script>

<style>
.matter-box {
    width: 100%;
    height: calc(100vh - 80px);
}

</style>