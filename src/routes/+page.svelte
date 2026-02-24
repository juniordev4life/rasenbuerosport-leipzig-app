<script>
	import { goto } from "$app/navigation";
	import { session, isLoading } from "$lib/stores/auth.stores.js";
	import { ROUTES } from "$lib/constants/routes.constants.js";

	$effect(() => {
		if (!$isLoading) {
			if ($session) {
				goto(ROUTES.DASHBOARD);
			} else {
				goto(ROUTES.LOGIN);
			}
		}
	});
</script>
