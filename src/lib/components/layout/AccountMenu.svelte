<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import LogoutIcon from "$lib/components/icons/LogoutIcon.svelte";
import SettingsIcon from "$lib/components/icons/SettingsIcon.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { logout } from "$lib/services/auth.services.js";

/**
 * Bottom-sheet (mobile) / popover (desktop) opened from the avatar
 * tap in the top bar. Carries the actions that used to live inside
 * the profile page: open Settings or log out.
 *
 * @type {{ onClose: () => void }}
 */
let { onClose } = $props();

const { t } = getTranslate();

async function handleLogout() {
	onClose();
	try {
		await logout();
		goto(ROUTES.LOGIN);
	} catch (err) {
		console.error("Logout failed:", err);
	}
}

function openSettings() {
	onClose();
	goto(ROUTES.SETTINGS);
}

function handleKeydown(event) {
	if (event.key === "Escape") onClose();
}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end bg-black/60 sm:bg-black/40 sm:p-4"
	onclick={onClose}
	role="dialog"
	aria-modal="true"
>
	<div
		class="w-full sm:w-72 bg-bg-secondary border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl p-2"
		onclick={(e) => e.stopPropagation()}
	>
		<button
			type="button"
			onclick={openSettings}
			class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-text-primary hover:bg-bg-input transition-colors"
		>
			<span class="text-text-secondary"><SettingsIcon size={18} /></span>
			<span class="text-sm font-semibold">{$t("nav.settings")}</span>
		</button>
		<button
			type="button"
			onclick={handleLogout}
			class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-accent-red hover:bg-accent-red/10 transition-colors"
		>
			<span><LogoutIcon size={18} /></span>
			<span class="text-sm font-semibold">{$t("profile.logout")}</span>
		</button>
	</div>
</div>
