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
	<button
		type="button"
		onclick={() => history.back()}
		class="flex items-center gap-1 text-text-secondary text-sm hover:text-text-primary transition-colors mb-2"
	>
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M15 19l-7-7 7-7" />
		</svg>
		{$t("common.back")}
	</button>
	<ProfilePage {playerId} onSelectRelation={handleRelationSelect} />
</div>
