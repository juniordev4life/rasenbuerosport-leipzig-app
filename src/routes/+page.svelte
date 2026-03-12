<script>
	import { goto } from "$app/navigation";
	import { user, isLoading } from "$lib/stores/auth.stores.js";
	import { ROUTES } from "$lib/constants/routes.constants.js";

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
