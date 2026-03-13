<script>
import { getTranslate } from "@tolgee/svelte";

let { onClose } = $props();

const { t } = getTranslate();
</script>

<!-- Backdrop -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
	role="dialog"
	aria-label={$t("elo.info_title")}
	onmousedown={(e) => { if (e.target === e.currentTarget) onClose(); }}
	onkeydown={(e) => e.key === "Escape" && onClose()}
>
	<div class="bg-bg-secondary border border-border rounded-xl w-full max-w-sm max-h-[80vh] flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-border shrink-0">
			<h3 class="text-sm font-medium text-text-primary">{$t("elo.info_title")}</h3>
			<button
				type="button"
				onclick={onClose}
				class="text-text-secondary hover:text-text-primary text-lg"
				aria-label="Close"
			>
				✕
			</button>
		</div>

		<!-- Scrollable content -->
		<div class="overflow-y-auto p-4 flex flex-col gap-4">
			<!-- What is Elo -->
			<div>
				<h4 class="text-xs font-bold text-text-primary mb-1">
					{$t("elo.info_what_title")}
				</h4>
				<p class="text-[11px] text-text-secondary leading-relaxed">
					{$t("elo.info_what_text")}
				</p>
			</div>

			<!-- How it works -->
			<div>
				<h4 class="text-xs font-bold text-text-primary mb-1">
					{$t("elo.info_how_title")}
				</h4>
				<p class="text-[11px] text-text-secondary leading-relaxed">
					{$t("elo.info_how_text")}
				</p>
			</div>

			<!-- Parameters -->
			<div>
				<h4 class="text-xs font-bold text-text-primary mb-2">
					{$t("elo.info_params_title")}
				</h4>
				<div class="flex flex-col gap-2">
					<div class="flex items-center gap-2.5">
						<span class="text-base shrink-0 w-6 text-center">🏁</span>
						<div class="flex-1 min-w-0">
							<p class="text-[11px] font-medium text-text-primary">{$t("elo.info_start_title")}</p>
							<p class="text-[10px] text-text-secondary">{$t("elo.info_start_text")}</p>
						</div>
					</div>
					<div class="flex items-center gap-2.5">
						<span class="text-base shrink-0 w-6 text-center">📊</span>
						<div class="flex-1 min-w-0">
							<p class="text-[11px] font-medium text-text-primary">{$t("elo.info_k_factor_title")}</p>
							<p class="text-[10px] text-text-secondary">{$t("elo.info_k_factor_text")}</p>
						</div>
					</div>
					<div class="flex items-center gap-2.5">
						<span class="text-base shrink-0 w-6 text-center">👥</span>
						<div class="flex-1 min-w-0">
							<p class="text-[11px] font-medium text-text-primary">{$t("elo.info_2v2_title")}</p>
							<p class="text-[10px] text-text-secondary">{$t("elo.info_2v2_text")}</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Example -->
			<div>
				<h4 class="text-xs font-bold text-text-primary mb-1">
					{$t("elo.info_example_title")}
				</h4>
				<div class="bg-bg-primary border border-border rounded-lg p-3">
					<p class="text-[11px] text-text-secondary leading-relaxed">
						{$t("elo.info_example_text")}
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
