<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import LogoutIcon from "$lib/components/icons/LogoutIcon.svelte";
import MessageIcon from "$lib/components/icons/MessageIcon.svelte";
import SettingsIcon from "$lib/components/icons/SettingsIcon.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { logout } from "$lib/services/auth.services.js";

/**
 * Bottom sheet (mobile) / popover (desktop) opened from the avatar in the
 * top bar: open Settings, send feedback, or log out.
 *
 * @type {{ onClose: () => void, onOpenFeedback?: () => void }}
 */
let { onClose, onOpenFeedback } = $props();

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

function handleFeedback() {
	if (onOpenFeedback) onOpenFeedback();
	else onClose();
}

function handleKeydown(event) {
	if (event.key === "Escape") onClose();
}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="scrim fixed inset-0 z-[60] flex items-end sm:items-start sm:justify-end sm:p-4 sm:pt-20 pb-[max(env(safe-area-inset-bottom),16px)] sm:pb-4"
	onclick={onClose}
>
	<div
		class="sheet w-full sm:w-72 p-2"
		role="dialog"
		aria-modal="true"
		aria-label={$t("nav.settings")}
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
	>
		<button type="button" onclick={openSettings} class="menu-item">
			<span class="text-muted"><SettingsIcon size={18} /></span>
			{$t("nav.settings")}
		</button>
		<button type="button" onclick={handleFeedback} class="menu-item">
			<span class="text-muted"><MessageIcon size={18} /></span>
			{$t("feedback.menu_item")}
		</button>
		<button type="button" onclick={handleLogout} class="menu-item text-brand">
			<LogoutIcon size={18} />
			{$t("profile.logout")}
		</button>
	</div>
</div>

<style>
.menu-item {
	display: flex;
	align-items: center;
	gap: 12px;
	width: 100%;
	min-height: 48px;
	padding: 0 12px;
	border-radius: var(--radius-tile);
	text-align: left;
	font-weight: 700;
	font-size: 15px;
}

.menu-item:hover {
	background: var(--color-sunken);
}
</style>
