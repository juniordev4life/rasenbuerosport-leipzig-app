<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import ProfilePage from "$lib/components/profile/ProfilePage.svelte";

const { t } = getTranslate();

const playerId = $derived(page.params.id);

function handleRelationSelect(rel) {
	if (!rel?.playerId) return;
	goto(`/app/profile/${rel.playerId}`);
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("profile.title")}</title>
</svelte:head>

<div class="mx-auto max-w-3xl p-3">
	<ProfilePage {playerId} onSelectRelation={handleRelationSelect} />
</div>
