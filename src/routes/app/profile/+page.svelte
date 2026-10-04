<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import ProfilePage from "$lib/components/profile/ProfilePage.svelte";
import { user } from "$lib/stores/auth.stores.js";

const { t } = getTranslate();

const playerId = $derived($user?.uid ?? null);

function handleRelationSelect(rel) {
	if (!rel?.playerId) return;
	goto(`/app/profile/${rel.playerId}`);
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("profile.title")}</title>
</svelte:head>

<ProfilePage {playerId} isOwnProfile onSelectRelation={handleRelationSelect} />
