<script>
/**
 * Top 3 mini-ranking. Medal emojis are an intentional exception to
 * the "no-emoji" rule — culturally readable, less ambiguous than an
 * SVG variant at this size.
 *
 * @type {{
 *   top3: Array<{ id: string, name: string, elo: number|null, avatarUrl?: string|null }>,
 * }}
 */
let { top3 = [] } = $props();

const MEDALS = ["🥇", "🥈", "🥉"];

function gradientFor(id) {
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
</script>

<div class="flex flex-col gap-1.5">
	{#each top3 as player, i (player.id)}
		<a
			href={`/app/profile/${player.id}`}
			class="bg-bg-card border border-border rounded-xl px-3 py-2.5 flex items-center gap-2.5 hover:bg-bg-input transition-colors"
		>
			<span class="w-[26px] text-center text-[18px] shrink-0">{MEDALS[i]}</span>
			<span
				class="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[12px] font-extrabold text-white shrink-0 overflow-hidden"
				style={player.avatarUrl ? "" : `background: ${gradientFor(player.id)};`}
			>
				{#if player.avatarUrl}
					<img src={player.avatarUrl} alt={player.name} class="w-full h-full object-cover" />
				{:else}
					{player.name.charAt(0).toUpperCase()}
				{/if}
			</span>
			<span class="flex-1 min-w-0 text-[13px] font-bold text-text-primary truncate">
				{player.name}
			</span>
			<span class="text-[14px] font-extrabold text-text-primary tabular-nums shrink-0">
				{player.elo ?? "—"}
			</span>
		</a>
	{/each}
</div>
