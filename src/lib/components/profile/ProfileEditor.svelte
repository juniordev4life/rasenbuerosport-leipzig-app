<script>
import { getTranslate } from "@tolgee/svelte";
import { updateProfile } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import CheckIcon from "$lib/components/icons/CheckIcon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import { auth, storage } from "$lib/config/firebase.config.js";
import { AVATAR_MAX_BYTES } from "$lib/constants/upload.constants.js";
import { patch } from "$lib/services/api.services.js";
import { user } from "$lib/stores/auth.stores.js";
import { isUploadableImageType } from "$lib/utils/image.utils.js";

/**
 * ProfileEditor - Inline edit form for username and avatar, as a card.
 * The heading comes from the surrounding section (Settings). The avatar
 * is a labelled file input: tap or click the picture, or focus it with
 * the keyboard and press Enter/Space.
 *
 * @param {string} currentUsername - Current username
 * @param {string|null} currentAvatarUrl - Current avatar URL
 * @param {Function} onClose - Close editor callback
 * @param {Function} onSaved - Called after successful save
 */
let {
	currentUsername = "",
	currentAvatarUrl = null,
	onClose,
	onSaved,
} = $props();

/**
 * When the editor is permanently mounted (no separate open/close
 * mode), the Cancel button has nothing meaningful to do — there's no
 * "previous state" to revert to. Treat the absence of `onClose` as
 * the signal to drop Cancel and keep only Save.
 */
const hasCancel = $derived(typeof onClose === "function");

let savedHint = $state(false);

const { t } = getTranslate();

let username = $state(currentUsername);
let saving = $state(false);
let error = $state("");
let avatarFile = $state(null);
let avatarPreview = $state(currentAvatarUrl);

/** Handle file selection for avatar */
function handleFileChange(e) {
	const file = e.target.files?.[0];
	if (!file) return;

	// Same type and size limits as storage.rules, so the user gets a
	// translated message instead of a raw storage/unauthorized error.
	if (!isUploadableImageType(file.type)) {
		error = $t("profile.edit.error_file_type");
		return;
	}
	if (file.size > AVATAR_MAX_BYTES) {
		error = $t("profile.edit.error_file_size");
		return;
	}

	avatarFile = file;
	avatarPreview = URL.createObjectURL(file);
	error = "";
}

/** Save profile changes */
async function handleSave() {
	if (!username.trim()) {
		error = $t("profile.edit.error_username_empty");
		return;
	}

	saving = true;
	error = "";

	try {
		let avatarUrl = currentAvatarUrl;

		// Upload avatar to Cloud Storage if changed
		if (avatarFile) {
			const userId = auth.currentUser?.uid;
			const ext = avatarFile.name.split(".").pop();
			const storageRef = ref(storage, `avatars/${userId}/avatar.${ext}`);

			await uploadBytes(storageRef, avatarFile);
			avatarUrl = await getDownloadURL(storageRef);
		}

		// Update Firebase Auth profile
		await updateProfile(auth.currentUser, {
			displayName: username.trim(),
			photoURL: avatarUrl,
		});

		// Update profile in backend via API. `avatar_url` goes out only after
		// a new upload: re-sending the current value would be checked against
		// the API's avatar allow-list and could block a plain username change.
		await patch("/v1/auth/profile", {
			username: username.trim(),
			...(avatarFile && { avatar_url: avatarUrl }),
		});

		// Refresh local user store with updated profile data
		user.update((current) => ({
			...current,
			user_metadata: {
				...current?.user_metadata,
				username: username.trim(),
				avatar_url: avatarUrl,
			},
		}));

		onSaved?.();
		savedHint = true;
		setTimeout(() => {
			savedHint = false;
		}, 2000);
	} catch (err) {
		console.error("Profile update failed:", err);
		error = err.message || $t("profile.edit.error_generic");
	} finally {
		saving = false;
	}
}
</script>

<div class="card editor">
	<div class="avatar-col">
		<label class="avatar-pick">
			<PlayerAvatar
				player={{ name: username, avatarUrl: avatarPreview }}
				size={88}
				self
			/>
			<span class="camera" aria-hidden="true">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
					<path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			</span>
			<input
				id="avatar-upload"
				type="file"
				accept="image/*"
				onchange={handleFileChange}
				class="sr-only"
				aria-label={$t("profile.edit.avatar_hint")}
			/>
		</label>
		<p class="hint">{$t("profile.edit.avatar_hint")}</p>
	</div>

	<div class="fields">
		<div class="flex flex-col gap-1.5">
			<label for="username-input" class="field-label">
				{$t("profile.edit.username_label")}
			</label>
			<input
				id="username-input"
				type="text"
				bind:value={username}
				maxlength="30"
				class="field"
			/>
		</div>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<div class="actions">
			{#if hasCancel}
				<Button variant="secondary" onclick={onClose} class="flex-1">
					{$t("profile.edit.cancel")}
				</Button>
			{/if}
			<Button variant="primary" onclick={handleSave} loading={saving} class="flex-1">
				{saving ? $t("profile.edit.saving") : $t("profile.edit.save")}
			</Button>
		</div>

		<p class="saved" role="status">
			{#if savedHint}
				<CheckIcon size={14} strokeWidth={3} />
				{$t("profile.edit.saved")}
			{/if}
		</p>
	</div>
</div>

<style>
.editor {
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 18px;
	padding: 20px 16px 16px;
}

.avatar-col {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
}

/* The picture is the file picker; the input stays focusable (sr-only)
 * and the visible focus ring sits on the picture. */
.avatar-pick {
	position: relative;
	display: inline-flex;
	border-radius: var(--radius-avatar);
	cursor: pointer;
}

.avatar-pick:has(input:focus-visible) {
	outline: 2px solid var(--color-navy);
	outline-offset: 3px;
}

:global([data-variant="b"]) .avatar-pick:has(input:focus-visible) {
	outline-color: var(--color-gold);
}

.camera {
	position: absolute;
	right: -6px;
	bottom: -6px;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2px solid var(--color-surface);
	border-radius: var(--radius-badge);
	background: var(--color-navy);
	color: var(--color-on-navy);
	transition: background-color 120ms;
}

.avatar-pick:hover .camera {
	background: var(--color-brand);
	color: var(--color-on-brand);
}

.hint {
	margin: 0;
	font-size: 12px;
	text-align: center;
	color: var(--color-muted);
}

.fields {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.field-label {
	font-weight: 700;
	font-size: 14px;
}

.error {
	margin: 0;
	font-size: 13px;
	font-weight: 500;
	color: var(--color-loss);
}

.actions {
	display: flex;
	align-items: center;
	gap: 12px;
}

/* Reserved line, so the "saved" note does not shift the card. */
.saved {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	min-height: 18px;
	margin: -4px 0 0;
	font-weight: 700;
	font-size: 13px;
	color: var(--color-win);
}
</style>
