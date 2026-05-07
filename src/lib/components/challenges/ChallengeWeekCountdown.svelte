<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Live countdown to the end of the active challenge week. Receives the
 * server-computed initial offset and re-renders every minute.
 *
 * @typedef {Object} ChallengeWeekCountdownProps
 * @property {number} msRemaining
 */
let { msRemaining } = $props();

const { t } = getTranslate();

let now = $state(Date.now());
const target = $derived(now + msRemaining);

$effect(() => {
	const id = setInterval(() => {
		now = Date.now();
	}, 60_000);
	return () => clearInterval(id);
});

const formatted = $derived.by(() => {
	const diff = Math.max(0, target - now);
	const totalMinutes = Math.floor(diff / 60_000);
	const days = Math.floor(totalMinutes / (60 * 24));
	const hours = Math.floor((totalMinutes / 60) % 24);
	const minutes = totalMinutes % 60;
	if (days > 0) {
		return `${days}${$t("challenges.days_short")} ${hours}${$t("challenges.hours_short")}`;
	}
	if (hours > 0) {
		return `${hours}${$t("challenges.hours_short")} ${minutes}${$t("challenges.minutes_short")}`;
	}
	return `${minutes}${$t("challenges.minutes_short")}`;
});
</script>

<span class="inline-flex items-center gap-1 text-[11px] tabular-nums text-text-secondary">
	<span aria-hidden="true">⏳</span>
	{$t("challenges.ends_in", { duration: formatted })}
</span>
