<script>
	import { getTranslate } from "@tolgee/svelte";
	import { supabase } from "$lib/config/supabase.config.js";
	import { user } from "$lib/stores/auth.stores.js";
	import Button from "$lib/components/ui/Button.svelte";

	/**
	 * ProfileEditor - Inline edit form for username and avatar
	 * @param {string} currentUsername - Current username
	 * @param {string|null} currentAvatarUrl - Current avatar URL
	 * @param {Function} onClose - Close editor callback
	 * @param {Function} onSaved - Called after successful save
	 */
	let { currentUsername = "", currentAvatarUrl = null, onClose, onSaved } = $props();

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

		// Validate file type and size
		if (!file.type.startsWith("image/")) {
			error = $t("profile.edit.error_file_type");
			return;
		}
		if (file.size > 2 * 1024 * 1024) {
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

			// Upload avatar if changed
			if (avatarFile) {
				const userId = $user?.id;
				const ext = avatarFile.name.split(".").pop();
				const filePath = `${userId}/avatar.${ext}`;

				const { error: uploadError } = await supabase.storage
					.from("avatars")
					.upload(filePath, avatarFile, { upsert: true });

				if (uploadError) throw uploadError;

				const { data: urlData } = supabase.storage
					.from("avatars")
					.getPublicUrl(filePath);

				// Append cache-buster to force refresh
				avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
			}

			// Update auth metadata (username)
			const { error: authError } = await supabase.auth.updateUser({
				data: { username: username.trim(), avatar_url: avatarUrl },
			});

			if (authError) throw authError;

			// Update profiles table directly
			const { error: profileError } = await supabase
				.from("profiles")
				.update({
					username: username.trim(),
					avatar_url: avatarUrl,
				})
				.eq("id", $user?.id);

			if (profileError) throw profileError;

			// Refresh local user store
			const { data: refreshData } = await supabase.auth.getUser();
			if (refreshData?.user) {
				user.set(refreshData.user);
			}

			onSaved?.();
		} catch (err) {
			console.error("Profile update failed:", err);
			error = err.message || $t("profile.edit.error_generic");
		} finally {
			saving = false;
		}
	}

	const initial = $derived(username?.charAt(0)?.toUpperCase() || "?");
</script>

<div class="bg-bg-secondary border border-border rounded-lg p-5 flex flex-col gap-4">
	<h3 class="text-sm font-bold text-text-primary text-center">
		{$t("profile.edit.title")}
	</h3>

	<!-- Avatar Preview + Upload -->
	<div class="flex flex-col items-center gap-2">
		<label for="avatar-upload" class="cursor-pointer group relative">
			{#if avatarPreview}
				<img
					src={avatarPreview}
					alt="Avatar"
					class="w-20 h-20 rounded-full object-cover ring-2 ring-border group-hover:ring-accent-red transition-colors"
				/>
			{:else}
				<div
					class="w-20 h-20 rounded-full bg-accent-red flex items-center justify-center text-3xl font-bold text-white ring-2 ring-border group-hover:ring-accent-red-light transition-colors"
				>
					{initial}
				</div>
			{/if}
			<!-- Camera overlay -->
			<div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			</div>
		</label>
		<input
			id="avatar-upload"
			type="file"
			accept="image/*"
			onchange={handleFileChange}
			class="hidden"
		/>
		<p class="text-[10px] text-text-secondary">{$t("profile.edit.avatar_hint")}</p>
	</div>

	<!-- Username Input -->
	<div class="flex flex-col gap-1">
		<label for="username-input" class="text-xs text-text-secondary font-medium">
			{$t("profile.edit.username_label")}
		</label>
		<input
			id="username-input"
			type="text"
			bind:value={username}
			maxlength="30"
			class="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-red"
		/>
	</div>

	<!-- Error -->
	{#if error}
		<p class="text-xs text-error text-center">{error}</p>
	{/if}

	<!-- Buttons -->
	<div class="flex gap-3">
		<Button variant="secondary" onclick={onClose} class="flex-1">
			{$t("profile.edit.cancel")}
		</Button>
		<Button variant="primary" onclick={handleSave} loading={saving} class="flex-1">
			{saving ? $t("profile.edit.saving") : $t("profile.edit.save")}
		</Button>
	</div>
</div>
