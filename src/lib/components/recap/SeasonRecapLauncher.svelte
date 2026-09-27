<script>
import { goto } from "$app/navigation";
import { page } from "$app/state";
import {
	getLeagueSeasons,
	getSeasonRecap,
} from "$lib/services/seasons.services.js";
import { isRecapSeen } from "$lib/utils/recapStory.utils.js";

/**
 * Invisible auto-launcher for the season recap story. Mounted once,
 * unconditionally, in the authorized branch of `/app/+layout.svelte`
 * (it must not sit inside the immersive-route gate, or it would
 * unmount/remount — and re-check — every time the user enters and
 * leaves the new-game wizard).
 *
 * On its one check this app session it looks for the most recently
 * closed league season with a generated recap and, if this device
 * hasn't seen it yet and the signed-in player actually has one,
 * navigates to its recap story. Every failure is swallowed — this
 * component must never block or interrupt the app.
 */

let checked = $state(false);

$effect(() => {
	if (checked) return;
	checked = true;

	const path = page.url.pathname;
	const isImmersive = path.startsWith("/app/games/new");
	const isRecapRoute = path.startsWith("/app/recap");
	if (isImmersive || isRecapRoute) return;

	(async () => {
		try {
			const seasons = await getLeagueSeasons();
			const closedWithRecap = seasons.find((s) => !s.is_current && s.has_recap);
			if (!closedWithRecap || isRecapSeen(closedWithRecap.id)) return;

			const recap = await getSeasonRecap(closedWithRecap.id);
			if (!recap) return;

			goto(`/app/recap/${closedWithRecap.id}`);
		} catch (err) {
			console.error("Season recap auto-launch failed:", err);
		}
	})();
});
</script>
