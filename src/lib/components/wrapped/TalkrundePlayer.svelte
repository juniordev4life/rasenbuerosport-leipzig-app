<script>
import { getTranslate } from "@tolgee/svelte";
import MatchAudioPlayer from "$lib/components/games/MatchAudioPlayer.svelte";
import { REPORTERS } from "$lib/constants/reporters.constants.js";

/**
 * Talkrunde block on the wrapped page — three-avatar lineup,
 * "Bürowoche besprochen"-style label and the shared
 * `<MatchAudioPlayer>` with the klassiker palette (accent red,
 * matches the dashboard card so the same content keeps the same
 * visual signature across surfaces).
 *
 * @type {{ audioUrl: string|null }}
 */
let { audioUrl = null } = $props();

const { t } = getTranslate();

const lineup = [
	{ key: "marcel", reporter: REPORTERS.klassiker },
	{ key: "sophie", reporter: REPORTERS.analyst },
	{ key: "frank", reporter: REPORTERS.euphoriker },
];
</script>

<section class="talkrunde">
	<header class="talkrunde-header">
		<div class="avatars">
			{#each lineup as r, i (r.key)}
				<img
					src={r.reporter.imageUrl}
					alt={r.reporter.name}
					class="avatar {r.key}"
					style={i === 0 ? "" : "margin-left: -8px;"}
					loading="lazy"
				/>
			{/each}
		</div>
		<div class="meta">
			<div class="meta-tag">{$t("wrapped.talkrunde.tag")}</div>
			<div class="meta-line">
				<strong>Marcel, Sophie &amp; Frank</strong>
				{$t("wrapped.talkrunde.lineup_suffix")}
			</div>
		</div>
	</header>

	<MatchAudioPlayer {audioUrl} reporterId="klassiker" />
</section>

<style>
	.talkrunde {
		background:
			radial-gradient(
				ellipse at top right,
				rgba(245, 158, 11, 0.18) 0%,
				transparent 60%
			),
			linear-gradient(180deg, #1a1f2a 0%, #131822 100%);
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: 18px;
		padding: 16px;
		margin-bottom: 20px;
		color: #e5e7eb;
		position: relative;
		overflow: hidden;
	}
	.talkrunde::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(
			90deg,
			transparent,
			#fbbf24 50%,
			transparent
		);
		opacity: 0.6;
	}
	.talkrunde-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 14px;
	}
	.avatars {
		display: flex;
		flex-shrink: 0;
	}
	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid #131822;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}
	.avatar.marcel {
		box-shadow: 0 0 0 1px rgba(226, 75, 74, 0.4);
	}
	.avatar.sophie {
		box-shadow: 0 0 0 1px rgba(147, 197, 253, 0.4);
	}
	.avatar.frank {
		box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.4);
	}
	.meta {
		flex: 1;
		min-width: 0;
	}
	.meta-tag {
		font-size: 10px;
		font-weight: 800;
		color: #fbbf24;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		margin-bottom: 2px;
	}
	.meta-line {
		font-size: 12px;
		color: #9ca3af;
	}
	.meta-line strong {
		color: #e5e7eb;
		font-weight: 600;
	}
</style>
