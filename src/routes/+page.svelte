<script>
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { session, isLoading } from "$lib/stores/auth.stores.js";
	import { ROUTES } from "$lib/constants/routes.constants.js";

	$effect(() => {
		if (!$isLoading) {
			// Invite/OAuth redirect: forward auth code to callback handler
			const code = page.url.searchParams.get("code");
			if (code) {
				goto(`/auth/callback?code=${code}`);
				return;
			}

			if ($session) {
				goto(ROUTES.DASHBOARD);
			} else {
				goto(ROUTES.LOGIN);
			}
		}
	});
</script>
