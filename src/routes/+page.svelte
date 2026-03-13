<script>
import { goto } from "$app/navigation";
import { ROUTES } from "$lib/constants/routes.constants.js";
import { isLoading, user } from "$lib/stores/auth.stores.js";

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
