<script>
	import { getTranslate } from "@tolgee/svelte";
	import AvatarChip from "./AvatarChip.svelte";
	import Button from "$lib/components/ui/Button.svelte";

	/**
	 * PlayerSelectionStep - Step 1 of new game wizard
	 * Each player avatar appears in both Home and Away columns.
	 * Tap in Home column → assign home. Tap in Away → assign away.
	 * Tap again on same side → remove. Tap other side → switch.
	 * Max 2 per side. A player cannot be on both sides.
	 */
	let {
		allPlayers = [],
		homePlayers = $bindable([]),
		awayPlayers = $bindable([]),
		onNext,
	} = $props();

	const { t } = getTranslate();

	const MAX_PER_SIDE = 2;
	const GUEST_ID = "__guest__";

	/** Determine which side a player is on */
	function getPlayerSide(playerId) {
		if (homePlayers.includes(playerId)) return "home";
		if (awayPlayers.includes(playerId)) return "away";
		return null;
	}

	/** Auto-derived game mode label */
	const modeLabel = $derived.by(() => {
		const h = homePlayers.length;
		const a = awayPlayers.length;
		if (h === 0 && a === 0) return null;
		return `${h}v${a}`;
	});

	/** Validation: at least 1 player on each side */
	const isValid = $derived(
		homePlayers.length >= 1 && awayPlayers.length >= 1,
	);

	/**
	 * Handle tapping a player avatar in a specific column
	 * @param {string} playerId
	 * @param {"home"|"away"} targetSide - The column that was tapped
	 */
	function handleTap(playerId, targetSide) {
		const currentSide = getPlayerSide(playerId);

		if (currentSide === targetSide) {
			// Already on this side → remove
			if (targetSide === "home") {
				homePlayers = homePlayers.filter((id) => id !== playerId);
			} else {
				awayPlayers = awayPlayers.filter((id) => id !== playerId);
			}
		} else if (currentSide === null) {
			// Unassigned → assign to target side if not full
			if (targetSide === "home" && homePlayers.length < MAX_PER_SIDE) {
				homePlayers = [...homePlayers, playerId];
			} else if (targetSide === "away" && awayPlayers.length < MAX_PER_SIDE) {
				awayPlayers = [...awayPlayers, playerId];
			}
		} else {
			// On the OTHER side → switch if target side has room
			if (targetSide === "home" && homePlayers.length < MAX_PER_SIDE) {
				awayPlayers = awayPlayers.filter((id) => id !== playerId);
				homePlayers = [...homePlayers, playerId];
			} else if (targetSide === "away" && awayPlayers.length < MAX_PER_SIDE) {
				homePlayers = homePlayers.filter((id) => id !== playerId);
				awayPlayers = [...awayPlayers, playerId];
			}
		}
	}

	/** Add a guest player to a specific side */
	function addGuest(side) {
		const guestCount = [...homePlayers, ...awayPlayers].filter((id) =>
			id.startsWith(GUEST_ID),
		).length;
		const guestId = `${GUEST_ID}${guestCount + 1}`;

		if (side === "home" && homePlayers.length < MAX_PER_SIDE) {
			homePlayers = [...homePlayers, guestId];
		} else if (side === "away" && awayPlayers.length < MAX_PER_SIDE) {
			awayPlayers = [...awayPlayers, guestId];
		}
	}

	/** Remove a guest from a side */
	function removeGuest(guestId, side) {
		if (side === "home") {
			homePlayers = homePlayers.filter((id) => id !== guestId);
		} else {
			awayPlayers = awayPlayers.filter((id) => id !== guestId);
		}
	}

	/** Get guest players assigned to a side */
	function getGuests(side) {
		const list = side === "home" ? homePlayers : awayPlayers;
		return list.filter((id) => id.startsWith(GUEST_ID));
	}

	const homeGuests = $derived(getGuests("home"));
	const awayGuests = $derived(getGuests("away"));
</script>

<div class="flex flex-col gap-4">
	<!-- Mode Badge -->
	{#if modeLabel}
		<div class="flex justify-center">
			<span class="bg-accent-red/20 text-accent-red text-xs font-bold px-3 py-1 rounded-full">
				{modeLabel}
			</span>
		</div>
	{/if}

	<!-- Dual-Column Player Grid -->
	<div class="grid grid-cols-2 gap-3">
		<!-- Home Column -->
		<div class="bg-bg-secondary border border-border rounded-lg p-3">
			<h3 class="text-xs font-bold text-accent-red text-center mb-3 uppercase tracking-wider">
				{$t("new_game.home")}
			</h3>
			<div class="flex flex-wrap gap-1 justify-center">
				{#each allPlayers as player (player.id)}
					{@const side = getPlayerSide(player.id)}
					<AvatarChip
						label={player.username}
						avatarUrl={player.avatar_url}
						side={side === "home" ? "home" : null}
						dimmed={side === "away"}
						onclick={() => handleTap(player.id, "home")}
					/>
				{/each}
			</div>

			<!-- Guest chips assigned to home -->
			{#if homeGuests.length > 0 || homePlayers.length < MAX_PER_SIDE}
				<div class="border-t border-border mt-2 pt-2 flex flex-wrap gap-1 justify-center">
					{#each homeGuests as guestId (guestId)}
						<AvatarChip
							label={$t("new_game.guest")}
							side="home"
							isGuest={true}
							onclick={() => removeGuest(guestId, "home")}
						/>
					{/each}
					{#if homePlayers.length < MAX_PER_SIDE}
						<AvatarChip
							label={$t("new_game.guest")}
							isGuest={true}
							onclick={() => addGuest("home")}
						/>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Away Column -->
		<div class="bg-bg-secondary border border-border rounded-lg p-3">
			<h3 class="text-xs font-bold text-blue-500 text-center mb-3 uppercase tracking-wider">
				{$t("new_game.away")}
			</h3>
			<div class="flex flex-wrap gap-1 justify-center">
				{#each allPlayers as player (player.id)}
					{@const side = getPlayerSide(player.id)}
					<AvatarChip
						label={player.username}
						avatarUrl={player.avatar_url}
						side={side === "away" ? "away" : null}
						dimmed={side === "home"}
						onclick={() => handleTap(player.id, "away")}
					/>
				{/each}
			</div>

			<!-- Guest chips assigned to away -->
			{#if awayGuests.length > 0 || awayPlayers.length < MAX_PER_SIDE}
				<div class="border-t border-border mt-2 pt-2 flex flex-wrap gap-1 justify-center">
					{#each awayGuests as guestId (guestId)}
						<AvatarChip
							label={$t("new_game.guest")}
							side="away"
							isGuest={true}
							onclick={() => removeGuest(guestId, "away")}
						/>
					{/each}
					{#if awayPlayers.length < MAX_PER_SIDE}
						<AvatarChip
							label={$t("new_game.guest")}
							isGuest={true}
							onclick={() => addGuest("away")}
						/>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Next Button -->
	<Button variant="primary" onclick={onNext} disabled={!isValid}>
		{$t("new_game.next")}
	</Button>
</div>
