<script>
import BallIcon from "$lib/components/icons/BallIcon.svelte";
import LightningIcon from "$lib/components/icons/LightningIcon.svelte";
import ShieldIcon from "$lib/components/icons/ShieldIcon.svelte";
import TrendDownIcon from "$lib/components/icons/TrendDownIcon.svelte";

/**
 * Stack of narrative series rows. Each row has a colour-coded left
 * border, an icon matching the type and a headline + detail.
 *
 * @type {{ series: Array<{ id: string, type: string, headline: string, detail: string }> }}
 */
let { series = [] } = $props();
</script>

<div class="flex flex-col gap-1.5">
	{#each series as s (s.id)}
		<div class="serie-row {s.type}">
			<div class="serie-icon {s.type}">
				{#if s.type === "win_streak"}
					<LightningIcon size={14} />
				{:else if s.type === "loss_streak"}
					<TrendDownIcon size={14} />
				{:else if s.type === "scoring"}
					<BallIcon size={14} />
				{:else if s.type === "defensive"}
					<ShieldIcon size={14} />
				{/if}
			</div>
			<div class="flex-1 min-w-0">
				<div class="text-[12px] font-bold text-text-primary truncate">
					{s.headline}
				</div>
				<div class="text-[10px] text-text-muted">
					{s.detail}
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
.serie-row {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 12px;
	padding: 9px 12px;
	display: flex;
	align-items: center;
	gap: 10px;
}
.serie-row.win_streak { border-left: 3px solid #84CC16; }
.serie-row.loss_streak { border-left: 3px solid #E24B4A; }
.serie-row.scoring { border-left: 3px solid #F59E0B; }
.serie-row.defensive { border-left: 3px solid #818CF8; }

.serie-icon {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.serie-icon.win_streak {
	background: rgba(132, 204, 22, 0.15);
	border: 1px solid rgba(132, 204, 22, 0.3);
	color: #84CC16;
}
.serie-icon.loss_streak {
	background: rgba(226, 75, 74, 0.15);
	border: 1px solid rgba(226, 75, 74, 0.3);
	color: #E24B4A;
}
.serie-icon.scoring {
	background: rgba(245, 158, 11, 0.15);
	border: 1px solid rgba(245, 158, 11, 0.3);
	color: #F59E0B;
}
.serie-icon.defensive {
	background: rgba(129, 140, 248, 0.15);
	border: 1px solid rgba(129, 140, 248, 0.3);
	color: #818CF8;
}
</style>
