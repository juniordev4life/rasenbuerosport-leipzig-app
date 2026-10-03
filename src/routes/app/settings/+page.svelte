<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import DesignPaletteIcon from "$lib/components/icons/DesignPaletteIcon.svelte";
import LogoutIcon from "$lib/components/icons/LogoutIcon.svelte";
import MessageIcon from "$lib/components/icons/MessageIcon.svelte";
import PushBellIcon from "$lib/components/icons/PushBellIcon.svelte";
import UserIcon from "$lib/components/icons/UserIcon.svelte";
import DesignVariantSelector from "$lib/components/profile/DesignVariantSelector.svelte";
import ProfileEditor from "$lib/components/profile/ProfileEditor.svelte";
import PushNotificationSettings from "$lib/components/profile/PushNotificationSettings.svelte";
import Button from "$lib/components/ui/Button.svelte";
import FeedbackSheet from "$lib/components/ui/FeedbackSheet.svelte";
import Section from "$lib/components/ui/Section.svelte";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { logout } from "$lib/services/auth.services.js";
import { user } from "$lib/stores/auth.stores.js";

const { t } = getTranslate();

const username = $derived($user?.user_metadata?.username || "");
const avatarUrl = $derived($user?.user_metadata?.avatar_url || null);

let feedbackOpen = $state(false);

async function handleLogout() {
	try {
		await logout();
		goto(ROUTES.LOGIN);
	} catch (err) {
		console.error("Logout failed:", err);
	}
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("nav.settings")}</title>
</svelte:head>

<div class="stack settings pb-4 lg:pb-8">
	<header class="hero bleed page-hero">
		<h1 class="page-title page-hero-title">{$t("nav.settings")}</h1>
	</header>

	<div class="settings-grid">
		<Section title={$t("profile.edit.title")}>
			{#snippet icon()}<UserIcon size={22} strokeWidth={2} />{/snippet}
			<ProfileEditor currentUsername={username} currentAvatarUrl={avatarUrl} />
		</Section>

		<Section title={$t("settings.design.title")}>
			{#snippet icon()}<DesignPaletteIcon size={22} strokeWidth={2} />{/snippet}
			<div class="card design-card">
				<DesignVariantSelector />
			</div>
		</Section>

		<Section title={$t("push.title")}>
			{#snippet icon()}<PushBellIcon size={22} strokeWidth={2} />{/snippet}
			<PushNotificationSettings />
		</Section>

		<Section title={$t("feedback.settings_section_title")}>
			{#snippet icon()}<MessageIcon size={22} strokeWidth={2} />{/snippet}
			<div class="card feedback">
				<p class="feedback-text">{$t("feedback.settings_section_body")}</p>
				<Button onclick={() => (feedbackOpen = true)}>
					{$t("feedback.settings_button")}
				</Button>
			</div>
		</Section>
	</div>

	<button type="button" class="btn btn-secondary btn-lg logout" onclick={handleLogout}>
		<LogoutIcon size={20} strokeWidth={2} />
		{$t("profile.logout")}
	</button>
</div>

{#if feedbackOpen}
	<FeedbackSheet onClose={() => (feedbackOpen = false)} />
{/if}

<style>
.settings-grid {
	display: grid;
	gap: var(--stack-gap);
	align-items: start;
}

.design-card {
	padding: 16px;
}

.feedback {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px;
}

.feedback-text {
	margin: 0;
	font-size: 14px;
	line-height: 1.45;
}

.logout {
	width: 100%;
	color: var(--color-brand);
}

/* Desktop: the top bar carries the title; the sections pair up in two
 * columns of a centred page. */
@media (min-width: 1024px) {
	.settings {
		max-width: 64rem;
		margin-inline: auto;
	}

	.page-hero {
		display: none;
	}

	.settings-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.logout {
		width: auto;
		align-self: flex-start;
		padding: 0 28px;
	}
}
</style>
