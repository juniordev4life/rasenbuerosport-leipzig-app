<script>
import Header from "$lib/components/layout/Header.svelte";
import BottomNav from "$lib/components/layout/BottomNav.svelte";
import Sidebar from "$lib/components/layout/Sidebar.svelte";

let { children } = $props();
</script>

<div class="min-h-screen bg-bg-primary flex flex-col lg:flex-row">
	<Sidebar />

	<div class="flex flex-col flex-1 pb-16 lg:pb-0">
		<Header />
		<main class="flex-1 px-4 lg:px-8 py-2 lg:py-6 max-w-lg lg:max-w-4xl mx-auto w-full">
			{@render children()}
		</main>
	</div>

	<BottomNav />
</div>
