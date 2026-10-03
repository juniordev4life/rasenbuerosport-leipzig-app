<script>
import { getTranslate } from "@tolgee/svelte";
import Sheet from "./Sheet.svelte";

/**
 * Sheet used by {@link InfoTip} to explain an in-app concept (ELO,
 * archetype, pass network, …). Title and body are Tolgee keys, so DE/EN
 * switching just works.
 *
 * @type {{ titleKey: string, bodyKey: string, onClose: () => void }}
 */
let { titleKey, bodyKey, onClose } = $props();

const { t } = getTranslate();
</script>

<Sheet title={$t(titleKey)} {onClose}>
	<p class="m-0 text-[15px] leading-relaxed whitespace-pre-line">{$t(bodyKey)}</p>
</Sheet>
