<script>
import { page } from "$app/state";
import { getTranslate } from "@tolgee/svelte";
import AxisInfoModal from "$lib/components/playerProfile/AxisInfoModal.svelte";
import FormSnapshot from "$lib/components/playerProfile/FormSnapshot.svelte";
import PlayerCharacter from "$lib/components/playerProfile/PlayerCharacter.svelte";
import PlayerHero from "$lib/components/playerProfile/PlayerHero.svelte";
import RelationshipCards from "$lib/components/playerProfile/RelationshipCards.svelte";
import TopBadgesRow from "$lib/components/playerProfile/TopBadgesRow.svelte";
import { getPlayerProfile } from "$lib/services/playerProfile.services.js";

const { t } = getTranslate();

const playerId = $derived(page.params.id);

let profile = $state(null);
let loading = $state(true);
let errorMsg = $state(null);
let activeAxis = $state(null);

$effect(() => {
	const id = playerId;
	if (!id) return;
	loading = true;
	errorMsg = null;
	getPlayerProfile(id)
		.then((data) => {
			profile = data;
		})
		.catch((err) => {
			errorMsg = err?.message || $t("player_profile.error");
		})
		.finally(() => {
			loading = false;
		});
});

const archetypeColor = $derived(profile?.archetype?.color ?? "#6b7280");
const isFreshman = $derived(profile?.profileState === "frischling");
const isDeveloping = $derived(profile?.profileState === "im_aufbau");
</script>

<svelte:head>
	<title>{profile?.player?.name ?? $t("player_profile.loading")}</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-4 p-4">
	{#if loading}
		<div class="bg-bg-secondary border border-border rounded-2xl p-8 text-center text-text-secondary">
			{$t("player_profile.loading")}
		</div>
	{:else if errorMsg}
		<div class="bg-bg-secondary border border-error/60 rounded-2xl p-6 text-center text-error">
			{errorMsg}
		</div>
	{:else if profile}
		<PlayerHero
			username={profile.player.name}
			avatarUrl={profile.player.avatarUrl}
			initials={profile.player.initials}
			archetype={profile.archetype}
			bio={profile.bio}
			matchCount={profile.player.matchCount}
			currentRating={profile.player.currentRating}
		/>

		{#if isFreshman}
			<div class="bg-bg-secondary border border-warning/60 rounded-2xl p-6 text-text-primary">
				<h2 class="text-lg font-bold text-warning">{$t("player_profile.freshman_title")}</h2>
				<p class="mt-2 text-sm text-text-secondary">{$t("player_profile.freshman_body")}</p>
			</div>
			<FormSnapshot recentForm={profile.recentForm ?? []} />
		{:else}
			{#if isDeveloping}
				<div class="bg-bg-secondary border border-accent-red/60 rounded-2xl p-4 text-text-primary">
					<h2 class="text-sm font-bold text-accent-red">{$t("player_profile.developing_title")}</h2>
					<p class="mt-1 text-xs text-text-secondary">{$t("player_profile.developing_body")}</p>
				</div>
			{/if}

			{#if profile.axes}
				<PlayerCharacter
					axes={profile.axes}
					color={archetypeColor}
					onAxisClick={(axis) => (activeAxis = axis)}
				/>
			{/if}

			<FormSnapshot recentForm={profile.recentForm ?? []} />

			<RelationshipCards relationships={profile.relationships ?? {}} />

			<TopBadgesRow badges={profile.topBadges ?? []} />
		{/if}
	{/if}
</div>

<AxisInfoModal
	axisKey={activeAxis}
	value={activeAxis ? profile?.axes?.[activeAxis] : null}
	onClose={() => (activeAxis = null)}
/>
