<script>
	import { getTranslate } from "@tolgee/svelte";

	let {
		favoriteOpponent = null,
		bestTeammate = null,
		favoriteTeam = null,
	} = $props();

	const { t } = getTranslate();
</script>

<div class="flex flex-col gap-3">
	<!-- Favorite Opponent -->
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-secondary mb-3">
			{$t("profile.favorite_opponent")}
		</h3>
		{#if favoriteOpponent}
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center text-sm font-bold text-text-primary"
				>
					{favoriteOpponent.username?.charAt(0)?.toUpperCase() || "?"}
				</div>
				<div>
					<p class="text-sm font-medium text-text-primary">
						{favoriteOpponent.username}
					</p>
					<p class="text-xs text-text-secondary">
						{$t("profile.games_played", { count: favoriteOpponent.games })}
					</p>
				</div>
			</div>
		{:else}
			<p class="text-sm text-text-secondary">{$t("profile.no_data")}</p>
		{/if}
	</div>

	<!-- Best Teammate -->
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-secondary mb-3">
			{$t("profile.best_teammate")}
		</h3>
		{#if bestTeammate}
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center text-sm font-bold text-text-primary"
				>
					{bestTeammate.username?.charAt(0)?.toUpperCase() || "?"}
				</div>
				<div>
					<p class="text-sm font-medium text-text-primary">
						{bestTeammate.username}
					</p>
					<p class="text-xs text-text-secondary">
						{$t("profile.games_played", { count: bestTeammate.games })}
					</p>
				</div>
			</div>
		{:else}
			<p class="text-sm text-text-secondary">{$t("profile.no_data")}</p>
		{/if}
	</div>

	<!-- Favorite Team -->
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<h3 class="text-sm font-medium text-text-secondary mb-3">
			{$t("profile.favorite_team")}
		</h3>
		{#if favoriteTeam}
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center text-xs font-bold text-text-primary"
				>
					{favoriteTeam.short_name || favoriteTeam.name?.charAt(0) || "?"}
				</div>
				<div>
					<p class="text-sm font-medium text-text-primary">
						{favoriteTeam.name}
					</p>
					<p class="text-xs text-text-secondary">
						{$t("profile.games_played", { count: favoriteTeam.games })}
					</p>
				</div>
			</div>
		{:else}
			<p class="text-sm text-text-secondary">{$t("profile.no_data")}</p>
		{/if}
	</div>
</div>
