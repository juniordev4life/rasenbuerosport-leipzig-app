<script>
	import Header from "$lib/components/layout/Header.svelte";
	import BottomNav from "$lib/components/layout/BottomNav.svelte";

	let { children } = $props();
</script>

<div class="min-h-screen bg-bg-primary flex flex-col pb-16">
	<Header />
	<main class="flex-1 px-4 py-2 max-w-lg mx-auto w-full">
		{@render children()}
	</main>
	<BottomNav />
</div>
