<script>
import { getTranslate } from "@tolgee/svelte";
import CheckIcon from "$lib/components/icons/CheckIcon.svelte";
import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * The opponent picker: every other player, sorted by ELO descending,
 * as a grid of avatar buttons (four columns on phones, more on wider
 * screens). The chosen opponent is pressed (`aria-pressed`) and carries
 * a check badge; design A also turns the avatar red and underlines the
 * name, design B rings the avatar in red.
 *
 * @type {{
 *   players: Array<{ id: string, username: string, avatarUrl: string|null, elo: number|null }>,
 *   currentUserId: string|null,
 *   selectedId: string|null,
 *   onSelect: (id: string) => void,
 * }}
 */
let { players, currentUserId, selectedId, onSelect } = $props();

const { t } = getTranslate();

const sorted = $derived(
	[...players]
		.filter((p) => p.id !== currentUserId)
		.sort((a, b) => (b.elo ?? 0) - (a.elo ?? 0)),
);
</script>

<Section title={$t("compare.grid_label")}>
	{#snippet icon()}<UsersIcon size={22} strokeWidth={2} />{/snippet}
	<div class="card picker">
		<div class="grid">
			{#each sorted as p (p.id)}
				{@const isSelf = p.id === currentUserId}
				{@const isSelected = p.id === selectedId}
				<button
					type="button"
					class="pick"
					aria-pressed={isSelected}
					disabled={isSelf}
					onclick={() => !isSelf && onSelect(p.id)}
				>
					<span class="pick-pic">
						<PlayerAvatar
							player={{ id: p.id, username: p.username, avatarUrl: p.avatarUrl }}
							size={48}
							class="pick-avatar"
						/>
						{#if isSelected}
							<span class="check" aria-hidden="true"><CheckIcon size={12} strokeWidth={3} /></span>
						{/if}
					</span>
					<span class="pick-name">{p.username}</span>
					<span class="pick-elo">{p.elo ?? "—"}</span>
				</button>
			{/each}
		</div>
	</div>
</Section>

<style>
.picker {
	padding: 14px;
}

.grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 14px 8px;
}

.pick {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	min-width: 0;
	padding: 6px 2px 8px;
	border: 0;
	border-radius: var(--radius-tile);
	background: transparent;
	color: var(--color-ink);
	font: inherit;
	cursor: pointer;
}

.pick:hover:not(:disabled) {
	background: var(--color-sunken);
}

.pick:disabled {
	cursor: not-allowed;
}

.pick-pic {
	position: relative;
	display: flex;
	margin-bottom: 2px;
}

.check {
	position: absolute;
	top: -6px;
	right: -8px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	border: 2px solid var(--color-surface);
	border-radius: 999px;
	background: var(--color-brand);
	color: var(--color-on-brand);
}

.pick-name {
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: 700;
	font-size: 13px;
}

.pick-elo {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 12px;
	font-variant-numeric: tabular-nums;
	color: var(--color-muted);
}

/* A: the pick turns red and gets an underline bar. */
.pick::after {
	content: "";
	width: 24px;
	height: 3px;
	margin-top: 2px;
	background: transparent;
}

.pick[aria-pressed="true"] .pick-name {
	color: var(--color-brand);
}

.pick[aria-pressed="true"]::after {
	background: var(--color-brand);
}

:global([data-variant="a"]) .pick[aria-pressed="true"] :global(.pick-avatar) {
	--avatar-bg: var(--color-brand);
	--avatar-fg: var(--color-on-brand);
}

@media (min-width: 640px) {
	.grid {
		grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
	}
}

/* B: round avatars with a red ring around the pick. */
:global([data-variant="b"]) .pick::after {
	display: none;
}

:global([data-variant="b"]) .pick[aria-pressed="true"] .pick-name {
	color: var(--color-ink);
}

:global([data-variant="b"]) .pick[aria-pressed="true"] :global(.pick-avatar) {
	box-shadow:
		0 0 0 2px var(--color-surface),
		0 0 0 5px var(--color-brand);
}

:global([data-variant="b"]) .pick-elo {
	font-weight: 800;
}
</style>
