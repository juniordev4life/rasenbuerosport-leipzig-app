<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import AxisInfoModal from "$lib/components/playerProfile/AxisInfoModal.svelte";
import FormSnapshot from "$lib/components/playerProfile/FormSnapshot.svelte";
import PlayerCharacter from "$lib/components/playerProfile/PlayerCharacter.svelte";
import PlayerHero from "$lib/components/playerProfile/PlayerHero.svelte";
import RelationshipCards from "$lib/components/playerProfile/RelationshipCards.svelte";
import TopBadgesRow from "$lib/components/playerProfile/TopBadgesRow.svelte";
import ProfileEditor from "$lib/components/profile/ProfileEditor.svelte";
import ThemeSelector from "$lib/components/profile/ThemeSelector.svelte";
import Button from "$lib/components/ui/Button.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { logout } from "$lib/services/auth.services.js";
import { getPlayerProfile } from "$lib/services/playerProfile.services.js";
import { user } from "$lib/stores/auth.stores.js";

const { t } = getTranslate();

const playerId = $derived($user?.uid ?? null);
const username = $derived($user?.user_metadata?.username || "");
const avatarUrl = $derived($user?.user_metadata?.avatar_url || null);

let profile = $state(null);
let loading = $state(true);
let errorMsg = $state(null);
let activeAxis = $state(null);
let editing = $state(false);

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

async function handleLogout() {
	try {
		await logout();
		goto(ROUTES.LOGIN);
	} catch (err) {
		console.error("Logout failed:", err);
	}
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("profile.title")}</title>
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
			rank={profile.player.rank}
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

		<!-- Settings -->
		<section class="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-4">
			<h2 class="text-[11px] tracking-[0.08em] uppercase text-text-muted font-semibold">
				{$t("profile.settings")}
			</h2>

			{#if editing}
				<ProfileEditor
					currentUsername={username}
					currentAvatarUrl={avatarUrl}
					onClose={() => (editing = false)}
					onSaved={() => (editing = false)}
				/>
			{:else}
				<Button variant="ghost" onclick={() => (editing = true)}>
					{$t("profile.edit.title")}
				</Button>
			{/if}

			<ThemeSelector />

			<Button variant="ghost" onclick={handleLogout}>
				{$t("profile.logout")}
			</Button>
		</section>
	{/if}
</div>

<AxisInfoModal
	axisKey={activeAxis}
	value={activeAxis ? profile?.axes?.[activeAxis] : null}
	onClose={() => (activeAxis = null)}
/>
