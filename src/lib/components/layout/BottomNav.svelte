<script>
	import { page } from "$app/state";
	import { getTranslate } from "@tolgee/svelte";
	import { ROUTES } from "$lib/constants/routes.constants.js";

	const { t } = getTranslate();

	const navItems = [
		{
			href: ROUTES.DASHBOARD,
			labelKey: "nav.dashboard",
			icon: "dashboard",
		},
		{
			href: ROUTES.LEADERBOARD,
			labelKey: "nav.leaderboard",
			icon: "leaderboard",
		},
		{
			href: ROUTES.GAMES,
			labelKey: "nav.games",
			icon: "games",
		},
		{
			href: ROUTES.PROFILE,
			labelKey: "nav.profile",
			icon: "profile",
		},
	];

	const isActive = (href) => page.url.pathname === href;
</script>

<nav
	class="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border px-2 py-1 z-50"
>
	<div class="flex justify-around items-center max-w-lg mx-auto">
		{#each navItems as item (item.href)}
			<a
				href={item.href}
				class="flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-colors
					{isActive(item.href) ? 'text-accent-red' : 'text-text-secondary hover:text-text-primary'}"
			>
				{#if item.icon === "dashboard"}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
						/>
					</svg>
				{:else if item.icon === "leaderboard"}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				{:else if item.icon === "games"}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				{:else if item.icon === "profile"}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
				{/if}
				<span class="text-xs font-medium">{$t(item.labelKey)}</span>
			</a>
		{/each}
	</div>
</nav>
