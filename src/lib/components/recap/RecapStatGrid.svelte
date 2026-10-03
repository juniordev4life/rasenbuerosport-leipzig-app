<script>
import CountUpNumber from "./CountUpNumber.svelte";

/**
 * Secondary stats of a season-recap slide (wins / draws / losses,
 * assists, biggest win …) as a grid of value + label pairs. Numbers
 * count up unless an item sets `countUp: false`; `text` items (club
 * names) render smaller and truncate; `extra` adds a small note after
 * the value ("×14", "70 %").
 * Design A: white display numbers over a hairline, straight on the
 * story frame. Design B: pale green tiles; `tone` colours a win green
 * and a loss red — always next to its label, never colour alone.
 *
 * @type {{
 *   items: Array<{
 *     key: string,
 *     label: string,
 *     value: number|string,
 *     countUp?: boolean,
 *     suffix?: string,
 *     extra?: string|null,
 *     tone?: "win"|"loss"|null,
 *     text?: boolean,
 *   }>,
 *   columns?: 2|3,
 *   reduced?: boolean,
 * }}
 */
let { items = [], columns = 2, reduced = false } = $props();
</script>

<dl class="stats" style:--cols={columns}>
	{#each items as item (item.key)}
		<div class="stat" data-tone={item.tone ?? null}>
			<dt class="stat-label">{item.label}</dt>
			<dd class="stat-value" class:text={item.text}>
				<span class="main" title={item.text ? String(item.value) : null}>
					{#if item.countUp !== false && typeof item.value === "number"}
						<CountUpNumber value={item.value} suffix={item.suffix ?? ""} {reduced} />
					{:else}
						{item.value}{item.suffix ?? ""}
					{/if}
				</span>
				{#if item.extra}
					<span class="extra">{item.extra}</span>
				{/if}
			</dd>
		</div>
	{/each}
</dl>

<style>
.stats {
	display: grid;
	grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
	gap: 18px 14px;
	margin: 0;
}

.stat {
	display: flex;
	flex-direction: column-reverse;
	justify-content: flex-end;
	gap: 6px;
	min-width: 0;
	padding-top: 10px;
	border-top: 1px solid currentColor;
}

.stat-value {
	display: flex;
	align-items: baseline;
	gap: 6px;
	min-width: 0;
	margin: 0;
	font-family: var(--font-num);
	font-weight: var(--num-weight);
	font-variant-numeric: tabular-nums;
	font-size: 36px;
	line-height: 0.9;
}

.main {
	min-width: 0;
}

.text {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 22px;
	line-height: 1.05;
	text-transform: var(--title-case);
}

.text .main {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.extra {
	flex-shrink: 0;
	font-family: var(--font-sans);
	font-weight: 700;
	font-size: 13px;
	text-transform: none;
}

.stat-label {
	font-family: var(--font-label);
	font-weight: var(--label-weight);
	text-transform: var(--label-case);
	letter-spacing: var(--label-tracking);
	font-size: 12px;
	line-height: 1.2;
}

:global([data-variant="b"]) .stats {
	gap: 8px;
}

:global([data-variant="b"]) .stat {
	align-items: center;
	gap: 4px;
	padding: 10px 8px;
	border-top: 0;
	border-radius: var(--radius-tile);
	background: var(--color-win-soft);
	text-align: center;
}

:global([data-variant="b"]) .stat-value {
	justify-content: center;
	max-width: 100%;
	font-size: 30px;
	color: var(--color-ink);
}

:global([data-variant="b"]) .text {
	font-weight: 800;
	font-size: 19px;
}

:global([data-variant="b"]) .stat[data-tone="win"] .stat-value {
	color: var(--color-win);
}

:global([data-variant="b"]) .stat[data-tone="loss"] .stat-value {
	color: var(--color-loss);
}

:global([data-variant="b"]) .extra {
	color: var(--color-muted);
}

:global([data-variant="b"]) .stat-label {
	color: var(--color-muted);
}
</style>
