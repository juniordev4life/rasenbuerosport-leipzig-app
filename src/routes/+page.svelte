<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { isLoading, user } from "$lib/stores/auth.stores.js";

const { t } = getTranslate();

$effect(() => {
	if (!$isLoading) {
		if ($user) {
			goto(ROUTES.DASHBOARD);
		} else {
			goto(ROUTES.LOGIN);
		}
	}
});
</script>

<!-- Only redirects. The page colour (and B's pitch) comes from the root
     layout, so the brief wait shows the same spinner as the auth check. -->
<div class="min-h-screen flex items-center justify-center">
	<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
</div>
