<script>
	import { getTranslate } from "@tolgee/svelte";
	import { supabase } from "$lib/config/supabase.config.js";
	import { post } from "$lib/services/api.services.js";

	/**
	 * MatchStatsUpload - Upload an FC26 stats screenshot for AI extraction
	 * Used on the game detail page for retroactive stats upload
	 */
	let { gameId, onStatsExtracted } = $props();

	const { t } = getTranslate();

	let uploading = $state(false);
	let error = $state("");
	let imagePreview = $state(null);
	let selectedFile = $state(null);

	/** Handle file selection */
	function handleFileChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			error = $t("match_stats.error_file_type");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			error = $t("match_stats.error_file_size");
			return;
		}

		selectedFile = file;
		imagePreview = URL.createObjectURL(file);
		error = "";
	}

	/** Upload image and extract stats */
	async function handleUpload() {
		if (!selectedFile) return;
		uploading = true;
		error = "";

		try {
			// 1. Upload to Supabase Storage
			const ext = selectedFile.name.split(".").pop();
			const filePath = `${gameId}/stats.${ext}`;

			const { error: uploadError } = await supabase.storage
				.from("match-stats")
				.upload(filePath, selectedFile, { upsert: true });

			if (uploadError) throw uploadError;

			const { data: urlData } = supabase.storage
				.from("match-stats")
				.getPublicUrl(filePath);

			// 2. Call backend to extract stats via Claude Vision
			const res = await post(`/v1/games/${gameId}/match-stats`, {
				imageUrl: urlData.publicUrl,
			});

			onStatsExtracted?.(res.data);
		} catch (err) {
			console.error("Stats upload failed:", err);
			error = err.message || $t("match_stats.error_generic");
		} finally {
			uploading = false;
		}
	}

	/** Remove selected file */
	function removeFile() {
		selectedFile = null;
		if (imagePreview) {
			URL.revokeObjectURL(imagePreview);
			imagePreview = null;
		}
		error = "";
	}
</script>

<div class="bg-bg-secondary border border-border rounded-lg p-4">
	<h3 class="text-sm font-medium text-text-primary mb-3">{$t("match_stats.title")}</h3>

	{#if imagePreview}
		<!-- Selected image preview -->
		<div class="flex items-center gap-3 mb-3">
			<img
				src={imagePreview}
				alt="Stats screenshot"
				class="w-20 h-20 object-cover rounded-md border border-border"
			/>
			<div class="flex-1 min-w-0">
				<p class="text-xs text-text-primary">{$t("match_stats.upload_ready")}</p>
				<p class="text-[10px] text-text-secondary">{selectedFile?.name}</p>
			</div>
			{#if !uploading}
				<button
					type="button"
					onclick={removeFile}
					class="text-text-secondary hover:text-accent-red text-lg shrink-0"
					aria-label="Remove"
				>
					✕
				</button>
			{/if}
		</div>

		<!-- Upload button -->
		<button
			type="button"
			onclick={handleUpload}
			disabled={uploading}
			class="w-full py-2.5 rounded-lg text-sm font-medium transition-colors
				{uploading
					? 'bg-accent-red/50 text-white cursor-wait'
					: 'bg-accent-red text-white hover:bg-accent-red/90'}"
		>
			{#if uploading}
				<span class="inline-flex items-center gap-2">
					<span class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
					{$t("match_stats.uploading")}
				</span>
			{:else}
				{$t("match_stats.upload_button")}
			{/if}
		</button>
	{:else}
		<!-- File picker -->
		<label class="flex items-center gap-3 cursor-pointer py-2">
			<div class="w-12 h-12 rounded-lg bg-bg-input border border-border flex items-center justify-center text-2xl">
				📸
			</div>
			<div class="flex-1">
				<p class="text-xs text-text-primary">{$t("match_stats.upload_title")}</p>
				<p class="text-[10px] text-text-secondary">{$t("match_stats.upload_hint")}</p>
			</div>
			<input
				type="file"
				accept="image/*"
				onchange={handleFileChange}
				class="hidden"
			/>
		</label>
	{/if}

	{#if error}
		<p class="text-xs text-accent-red mt-2">{error}</p>
	{/if}
</div>
