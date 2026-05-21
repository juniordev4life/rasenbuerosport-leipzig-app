<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Step 1 of the new-game wizard — a console-lobby style player picker.
 *
 * Layout
 *   Desktop (lg+): three columns side-by-side — Heim (left), Pool
 *   (center), Auswärts (right). Pool players show hover ◀/▶ arrows
 *   that assign to one side; they can also be dragged into a zone.
 *   Filled slots show a × to remove and are themselves draggable to
 *   move between teams.
 *
 *   Mobile: vertical stack — Heim on top, Pool in the middle,
 *   Auswärts at the bottom. Tapping a pool player selects it and
 *   reveals ▲/▼ arrows to assign up/down.
 *
 * Game mode (1v1 / 2v2 / 3v3) is derived from the slot counts; the
 * lobby supports up to 5 players per side but the wizard's "Weiter"
 * CTA only enables once both sides have ≥1 player.
 *
 * @type {{
 *   allPlayers: Array<{ id: string, username: string, avatar_url?: string|null }>,
 *   homePlayers: string[],
 *   awayPlayers: string[],
 *   onNext: () => void,
 *   onCancel: () => void,
 * }}
 */
let {
	allPlayers = [],
	homePlayers = $bindable([]),
	awayPlayers = $bindable([]),
	onNext,
	onCancel,
} = $props();

const { t } = getTranslate();

const MAX_PER_SIDE = 5;
const GUEST_ID = "__guest__";

let selectedId = $state(null);
let draggingId = $state(null);

const assigned = $derived(new Set([...homePlayers, ...awayPlayers]));
const isValid = $derived(homePlayers.length >= 1 && awayPlayers.length >= 1);

function getPlayerSide(id) {
	if (homePlayers.includes(id)) return "home";
	if (awayPlayers.includes(id)) return "away";
	return null;
}

function assign(id, side) {
	const current = getPlayerSide(id);
	if (current === side) return;
	if (current === "home") homePlayers = homePlayers.filter((p) => p !== id);
	if (current === "away") awayPlayers = awayPlayers.filter((p) => p !== id);
	if (side === "home" && homePlayers.length < MAX_PER_SIDE) {
		homePlayers = [...homePlayers, id];
	} else if (side === "away" && awayPlayers.length < MAX_PER_SIDE) {
		awayPlayers = [...awayPlayers, id];
	}
	selectedId = null;
}

function unassign(id) {
	homePlayers = homePlayers.filter((p) => p !== id);
	awayPlayers = awayPlayers.filter((p) => p !== id);
}

function addGuest(side) {
	const count = [...homePlayers, ...awayPlayers].filter((id) =>
		id.startsWith(GUEST_ID),
	).length;
	const guestId = `${GUEST_ID}${count + 1}`;
	if (side === "home" && homePlayers.length < MAX_PER_SIDE) {
		homePlayers = [...homePlayers, guestId];
	} else if (side === "away" && awayPlayers.length < MAX_PER_SIDE) {
		awayPlayers = [...awayPlayers, guestId];
	}
}

function playerById(id) {
	if (id.startsWith(GUEST_ID)) {
		return { id, username: $t("new_game.guest"), avatar_url: null };
	}
	return (
		allPlayers.find((p) => p.id === id) ?? {
			id,
			username: "?",
			avatar_url: null,
		}
	);
}

/**
 * Deterministic gradient per player based on the id string so each
 * avatar gets the same colour across re-renders without needing a
 * stored colour column.
 */
function avatarGradient(id) {
	const palette = [
		["#84CC16", "#65A30D"],
		["#E24B4A", "#C73E3D"],
		["#6366F1", "#4338CA"],
		["#F59E0B", "#D97706"],
		["#06B6D4", "#0891B2"],
		["#A78BFA", "#7C3AED"],
		["#EC4899", "#BE185D"],
		["#14B8A6", "#0F766E"],
	];
	let hash = 0;
	for (let i = 0; i < id.length; i += 1) {
		hash = (hash * 31 + id.charCodeAt(i)) | 0;
	}
	const [a, b] = palette[Math.abs(hash) % palette.length];
	return `linear-gradient(135deg, ${a}, ${b})`;
}

function onDragStart(event, id) {
	draggingId = id;
	event.dataTransfer?.setData("text/plain", id);
	event.dataTransfer?.setDragImage?.(event.currentTarget, 24, 24);
}

function onDragEnd() {
	draggingId = null;
}

function onDropOn(side, event) {
	event.preventDefault();
	const id = event.dataTransfer?.getData("text/plain") || draggingId;
	if (!id) return;
	if (side === "pool") {
		unassign(id);
	} else {
		assign(id, side);
	}
}

function onDragOver(event) {
	event.preventDefault();
}

function togglePoolSelect(id) {
	if (assigned.has(id)) return;
	selectedId = selectedId === id ? null : id;
}

const modeBadge = $derived.by(() => {
	const h = homePlayers.length;
	const a = awayPlayers.length;
	if (h === 0 && a === 0) return null;
	return `${h}v${a}`;
});
</script>

{#snippet avatar(id, size)}
	{@const p = playerById(id)}
	{#if p.avatar_url}
		<img src={p.avatar_url} alt={p.username} class="{size} rounded-full object-cover shadow-md" />
	{:else}
		<div
			class="{size} rounded-full flex items-center justify-center font-bold text-white shadow-md"
			style="background: {avatarGradient(id)};"
		>
			{p.username.charAt(0).toUpperCase()}
		</div>
	{/if}
{/snippet}

{#snippet filledSlot(id, side)}
	{@const p = playerById(id)}
	<div
		class="relative flex flex-col items-center gap-1.5 lg:flex-row lg:gap-3 rounded-xl border border-border bg-white/[0.04] px-3 py-2 lg:px-4 lg:py-2.5 lg:max-w-[200px] lg:w-full cursor-grab active:cursor-grabbing"
		draggable="true"
		ondragstart={(e) => onDragStart(e, id)}
		ondragend={onDragEnd}
	>
		<button
			type="button"
			onclick={() => unassign(id)}
			class="absolute -top-1.5 -right-1.5 lg:static lg:order-3 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-bg-input lg:bg-transparent border-2 border-bg-secondary lg:border-0 flex items-center justify-center text-xs text-text-secondary hover:text-accent-red"
			aria-label={$t("common.close")}
		>×</button>
		{@render avatar(id, "w-11 h-11 lg:w-10 lg:h-10")}
		<span class="lg:flex-1 lg:min-w-0 text-[11px] lg:text-sm font-semibold text-center lg:text-left truncate max-w-[88px] lg:max-w-none">
			{p.username}
		</span>
	</div>
{/snippet}

{#snippet teamZone(side, slots)}
	{@const accent = side === "home" ? "text-accent-red" : "text-success"}
	{@const borderColor = side === "home" ? "border-accent-red/40" : "border-success/40"}
	{@const gradient = side === "home"
		? "bg-gradient-to-b from-accent-red/[0.06] to-black/25"
		: "bg-gradient-to-t from-success/[0.06] to-black/25"}
	<div
		class="rounded-2xl border-2 border-dashed {borderColor} {gradient} p-4 lg:flex lg:flex-col {draggingId && draggingId !== ''
			? 'ring-2 ring-offset-2 ring-offset-bg-card'
			: ''}"
		ondragover={onDragOver}
		ondrop={(e) => onDropOn(side, e)}
		role="region"
		aria-label={side === "home" ? $t("new_game.home") : $t("new_game.away")}
	>
		<div class="flex items-center justify-between mb-3 lg:justify-center lg:flex-col lg:gap-1 lg:mb-4">
			<span class="text-[11px] tracking-[0.12em] uppercase font-extrabold {accent}">
				{side === "home" ? `▲ ${$t("new_game.home")}` : `▼ ${$t("new_game.away")}`}
			</span>
			<span class="text-[11px] text-text-muted">
				<strong class="text-text-primary">{slots.length}</strong> {$t("new_game.lobby.of")} {MAX_PER_SIDE}
			</span>
		</div>
		<div class="flex flex-wrap justify-center gap-2.5 lg:flex-col lg:items-center lg:gap-3 lg:flex-1 lg:justify-center min-h-[76px]">
			{#each slots as id (id)}
				{@render filledSlot(id, side)}
			{/each}
			{#if slots.length < MAX_PER_SIDE}
				<button
					type="button"
					onclick={() => addGuest(side)}
					class="rounded-xl border border-dashed border-border bg-white/[0.02] px-3 py-2 lg:px-4 lg:py-2.5 text-[11px] lg:text-sm text-text-muted hover:text-text-primary hover:border-text-muted"
				>
					+ {$t("new_game.add_guest")}
				</button>
			{/if}
		</div>
	</div>
{/snippet}

<div class="flex flex-col gap-4 lg:gap-6">
	{#if modeBadge}
		<div class="flex justify-center">
			<span class="bg-accent-red/15 text-accent-red text-xs font-bold px-3 py-1 rounded-full tabular-nums">
				{modeBadge}
			</span>
		</div>
	{/if}

	<div
		class="rounded-2xl border border-border bg-bg-card p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr_1fr] gap-3 lg:gap-4 lg:items-stretch"
	>
		<!-- Heim -->
		<div class="lg:order-1">
			{@render teamZone("home", homePlayers)}
		</div>

		<!-- Pool -->
		<div
			class="lg:order-2 rounded-2xl border border-border bg-white/[0.02] p-4 lg:p-5"
			ondragover={onDragOver}
			ondrop={(e) => onDropOn("pool", e)}
			role="region"
			aria-label={$t("new_game.lobby.pool_title")}
		>
			<div class="text-center mb-3 pb-3 border-b border-border">
				<div class="text-[11px] tracking-[0.1em] uppercase font-bold text-text-secondary">
					{$t("new_game.lobby.pool_title")}
				</div>
				<div class="text-[10px] lg:text-[11px] text-text-muted mt-0.5">
					{$t("new_game.lobby.pool_hint")}
				</div>
			</div>

			<div class="grid grid-cols-4 lg:grid-cols-3 gap-2 lg:gap-2.5">
				{#each allPlayers as player (player.id)}
					{@const isAssigned = assigned.has(player.id)}
					{@const isSelected = selectedId === player.id}
					<button
						type="button"
						class="group relative flex flex-col items-center gap-1.5 rounded-xl border border-transparent px-1 py-2.5 transition-all
							{isAssigned ? 'opacity-25 pointer-events-none' : 'bg-white/[0.03] hover:bg-white/[0.06] hover:-translate-y-0.5 hover:border-border'}
							{isSelected ? '!bg-white/[0.08] !border-accent-red ring-2 ring-accent-red/20' : ''}"
						draggable={!isAssigned}
						ondragstart={(e) => onDragStart(e, player.id)}
						ondragend={onDragEnd}
						onclick={() => togglePoolSelect(player.id)}
					>
						{@render avatar(player.id, "w-11 h-11 lg:w-12 lg:h-12")}
						<span class="text-[10px] lg:text-[11px] font-semibold text-text-secondary max-w-[72px] truncate">
							{player.username}
						</span>

						{#if !isAssigned}
							<!-- Desktop hover arrows: left = home, right = away -->
							<span class="hidden lg:flex absolute inset-y-0 inset-x-0 items-center justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
								<span
									role="button"
									tabindex="0"
									class="w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-accent-red text-xs font-bold pointer-events-auto hover:scale-110 transition-transform"
									aria-label={$t("new_game.lobby.assign_home")}
									onclick={(e) => { e.stopPropagation(); assign(player.id, "home"); }}
									onkeydown={(e) => { if (e.key === "Enter") { e.stopPropagation(); assign(player.id, "home"); } }}
								>◀</span>
								<span
									role="button"
									tabindex="0"
									class="w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-success text-xs font-bold pointer-events-auto hover:scale-110 transition-transform"
									aria-label={$t("new_game.lobby.assign_away")}
									onclick={(e) => { e.stopPropagation(); assign(player.id, "away"); }}
									onkeydown={(e) => { if (e.key === "Enter") { e.stopPropagation(); assign(player.id, "away"); } }}
								>▶</span>
							</span>

							<!-- Mobile selected arrows: top = home, bottom = away -->
							{#if isSelected}
								<span class="lg:hidden absolute -top-3 -bottom-3 inset-x-0 flex flex-col items-center justify-between pointer-events-none z-10">
									<button
										type="button"
										onclick={(e) => { e.stopPropagation(); assign(player.id, "home"); }}
										class="w-8 h-8 rounded-full bg-bg-primary border-2 border-accent-red text-accent-red text-sm font-bold flex items-center justify-center pointer-events-auto"
										aria-label={$t("new_game.lobby.assign_home")}
									>▲</button>
									<button
										type="button"
										onclick={(e) => { e.stopPropagation(); assign(player.id, "away"); }}
										class="w-8 h-8 rounded-full bg-bg-primary border-2 border-success text-success text-sm font-bold flex items-center justify-center pointer-events-auto"
										aria-label={$t("new_game.lobby.assign_away")}
									>▼</button>
								</span>
							{/if}
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Auswärts -->
		<div class="lg:order-3">
			{@render teamZone("away", awayPlayers)}
		</div>
	</div>

	<div class="text-center text-xs text-text-muted">
		<span class="hidden lg:inline">💡 {$t("new_game.lobby.helper_desktop")}</span>
		<span class="lg:hidden">💡 {$t("new_game.lobby.helper_mobile")}</span>
	</div>

	<div class="flex gap-3">
		<button
			type="button"
			onclick={onCancel}
			class="flex-shrink-0 px-5 py-3.5 rounded-xl bg-bg-input border border-border text-sm font-semibold text-text-secondary hover:bg-bg-secondary"
		>
			{$t("new_game.cancel")}
		</button>
		<button
			type="button"
			onclick={onNext}
			disabled={!isValid}
			class="flex-1 px-5 py-3.5 rounded-xl bg-accent-red text-white text-sm font-semibold shadow-lg shadow-accent-red/25 disabled:opacity-40 disabled:shadow-none hover:bg-accent-red-hover transition-all"
		>
			{$t("new_game.next")} →
		</button>
	</div>
</div>
