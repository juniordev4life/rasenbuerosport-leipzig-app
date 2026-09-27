<script>
/**
 * Lightweight CSS-only confetti burst — a fixed number of coloured
 * pieces falling via a CSS keyframe animation with a randomised drift
 * and spin per piece. Renders nothing under `prefers-reduced-motion`
 * (pass `reduced`) or while `active` is false.
 *
 * @type {{ active?: boolean, reduced?: boolean, pieceCount?: number }}
 */
let { active = true, reduced = false, pieceCount = 24 } = $props();

const COLORS = ["#E24B4A", "#84CC16", "#F59E0B", "#3B82F6", "#EC4899"];

const pieces = $derived.by(() => {
	if (!active || reduced) return [];
	return Array.from({ length: pieceCount }, (_, i) => ({
		id: i,
		left: Math.random() * 100,
		delay: Math.random() * 0.4,
		duration: 2.2 + Math.random() * 1.4,
		spinEnd: 360 + Math.random() * 360,
		color: COLORS[i % COLORS.length],
		drift: Math.round((Math.random() - 0.5) * 120),
	}));
});
</script>

{#if pieces.length > 0}
	<div class="pointer-events-none fixed inset-0 overflow-hidden z-[60]" aria-hidden="true">
		{#each pieces as piece (piece.id)}
			<span
				class="confetti-piece"
				style:left="{piece.left}%"
				style:background={piece.color}
				style:animation-delay="{piece.delay}s"
				style:animation-duration="{piece.duration}s"
				style:--confetti-drift="{piece.drift}px"
				style:--confetti-spin="{piece.spinEnd}deg"
			></span>
		{/each}
	</div>
{/if}

<style>
.confetti-piece {
	position: absolute;
	top: -10px;
	width: 8px;
	height: 14px;
	border-radius: 2px;
	animation-name: confetti-fall;
	animation-timing-function: ease-in;
	animation-fill-mode: forwards;
}
@keyframes confetti-fall {
	0% {
		transform: translate(0, -10px) rotate(0deg);
		opacity: 1;
	}
	100% {
		transform: translate(var(--confetti-drift), 100vh) rotate(var(--confetti-spin));
		opacity: 0.2;
	}
}
</style>
