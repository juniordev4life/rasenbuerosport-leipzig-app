<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Hero block: avatar + name + archetype-title on the left, ELO on the right
 * on >= sm screens. On mobile the ELO drops down into the stats row to keep
 * the title from getting squeezed against a two-digit / four-digit number.
 *
 * @type {{ username:string, avatarUrl:string|null, initials:string, archetype:{label:string,color:string,icon:string}|null, bio:{adjective:string,bio:string}|null, matchCount:number, currentRating:number|null, rank:number|null }}
 */
let {
	username,
	avatarUrl,
	initials,
	archetype,
	bio,
	matchCount,
	currentRating,
	rank,
} = $props();

const { t } = getTranslate();

/**
 * Map backend archetype-icon identifiers to display emojis. The backend
 * stores these as plain strings (see profileArchetypes.constants.js)
 * so the frontend owns the actual glyph.
 */
const ARCHETYPE_EMOJI = {
	striker: "⚽",
	playmaker: "🎯",
	metronome: "⏱️",
	"all-around": "🌟",
	fire: "🔥",
	shield: "🛡️",
	"arm-flex": "💪",
	"clock-late": "⏰",
};

const archetypeEmoji = $derived(
	archetype?.icon ? (ARCHETYPE_EMOJI[archetype.icon] ?? "") : "",
);

const archetypeTitle = $derived.by(() => {
	if (!archetype) return "";
	const adj = bio?.adjective ? `${bio.adjective} ` : "";
	return `${adj}${archetype.label}`;
});

const hasElo = $derived(currentRating !== null && currentRating !== undefined);
</script>

<div class="bg-bg-secondary border border-border rounded-2xl p-6 shadow-sm">
	<div class="flex items-start gap-4">
		<div
			class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
			style="background: linear-gradient(135deg, {archetype?.color ?? 'var(--color-text-muted)'}, var(--color-bg-card));"
		>
			{#if avatarUrl}
				<img src={avatarUrl} alt={username} class="h-20 w-20 rounded-full object-cover" />
			{:else}
				{initials}
			{/if}
		</div>
		<div class="min-w-0 flex-1">
			<h1 class="truncate text-2xl font-bold text-text-primary">{username}</h1>
			{#if archetype}
				<p class="mt-1 text-sm font-semibold" style="color: {archetype.color};">
					{archetypeEmoji}
					{archetypeTitle}
				</p>
			{/if}
		</div>
		{#if hasElo}
			<div class="hidden sm:block text-right shrink-0">
				<div class="text-xs uppercase tracking-wide text-text-secondary">
					{$t("player_profile.rating")}
				</div>
				<div class="text-2xl font-bold text-text-primary">{Math.round(currentRating)}</div>
				{#if rank}
					<div class="text-xs text-text-muted">#{rank}</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if bio?.bio}
		<p class="mt-4 text-sm italic text-text-secondary">„{bio.bio}"</p>
	{/if}

	<div class="mt-4 flex gap-6 border-t border-border pt-4 text-sm">
		<div>
			<div class="text-text-secondary">{$t("player_profile.matches")}</div>
			<div class="text-lg font-bold text-text-primary">{matchCount}</div>
		</div>
		{#if hasElo}
			<div class="sm:hidden">
				<div class="text-text-secondary">{$t("player_profile.rating")}</div>
				<div class="text-lg font-bold text-text-primary">
					{Math.round(currentRating)}
					{#if rank}
						<span class="text-xs font-normal text-text-muted">· #{rank}</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
