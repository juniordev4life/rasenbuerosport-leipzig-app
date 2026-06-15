<script>
import { getTranslate } from "@tolgee/svelte";
import { untrack } from "svelte";
import { goto, replaceState } from "$app/navigation";
import ModeTabs from "$lib/components/compare/ModeTabs.svelte";
import PlayerSlot from "$lib/components/compare/PlayerSlot.svelte";
import SelectionGrid from "$lib/components/compare/SelectionGrid.svelte";
import { get } from "$lib/services/api.services.js";
import { user } from "$lib/stores/auth.stores.js";
import { buildEloHistory } from "$lib/utils/eloHistory.utils.js";

const { t } = getTranslate();

let players = $state([]);
let games = $state([]);
let loading = $state(true);
let mode = $state("players");
let opponentId = $state(initialOpponentId());
let toast = $state(null);

const userId = $derived($user?.uid ?? null);
const userName = $derived($user?.user_metadata?.username ?? "?");
const userAvatar = $derived($user?.user_metadata?.avatar_url ?? null);

function initialOpponentId() {
	if (typeof window === "undefined") return null;
	return new URL(window.location.href).searchParams.get("opp");
}

$effect(() => {
	let aborted = false;
	(async () => {
		try {
			const [playersRes, gamesRes] = await Promise.all([
				get("/v1/players"),
				get("/v1/games?limit=200"),
			]);
			if (aborted) return;
			players = playersRes.data ?? [];
			games = gamesRes.data ?? [];
		} catch (err) {
			console.error("Compare load failed:", err);
		} finally {
			if (!aborted) loading = false;
		}
	})();
	return () => {
		aborted = true;
	};
});

$effect(() => {
	const id = opponentId;
	untrack(() => {
		if (typeof window === "undefined") return;
		const url = new URL(window.location.href);
		if (id) url.searchParams.set("opp", id);
		else url.searchParams.delete("opp");
		if (url.search !== window.location.search) replaceState(url, {});
	});
});

const eloHistory = $derived(buildEloHistory(games, { mode: "all" }));

const playerList = $derived.by(() =>
	(players ?? []).map((p) => {
		const entry = eloHistory.get(p.id);
		return {
			id: p.id,
			username: p.username,
			avatarUrl: p.avatar_url ?? null,
			elo: entry?.currentRating ?? p.current_rating ?? null,
		};
	}),
);

const me = $derived(playerList.find((p) => p.id === userId));

const selectedOpponent = $derived(
	opponentId ? (playerList.find((p) => p.id === opponentId) ?? null) : null,
);

const pageTitle = $t("compare.ready_title");
const pageSub = $t("compare.pick_sub_empty");

function pickOpponent(id) {
	opponentId = id === opponentId ? null : id;
}

function clearOpponent() {
	opponentId = null;
}

function showSoonToast() {
	toast = $t("compare.duo_soon_toast");
	setTimeout(() => {
		toast = null;
	}, 2400);
}

function startCompare() {
	if (!userId || !opponentId) return;
	goto(`/app/compare/h2h/${userId}/${opponentId}`);
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("compare.title")}</title>
</svelte:head>

<div class="mx-auto max-w-3xl lg:max-w-none xl:max-w-[1100px] px-3 lg:px-0 pb-48 lg:pb-8 pt-0 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-x-6 lg:items-start">
	<header class="mb-2 lg:hidden">
		<h1 class="text-2xl font-extrabold tracking-tight text-text-primary whitespace-nowrap">{pageTitle}</h1>
		<p class="text-xs text-text-secondary mt-1">{pageSub}</p>
	</header>

	<div class="mb-3 lg:mb-0 lg:col-start-1 lg:row-start-1">
		<ModeTabs value={mode} onSelect={(v) => (mode = v)} onDuoTap={showSoonToast} />
	</div>

	<!-- Rail (desktop): VS pairing + start CTA, sticky beside the picker. -->
	<div class="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-20 lg:flex lg:flex-col lg:gap-3">
	<div class="slots">
		<PlayerSlot
			state="locked"
			accent="self"
			player={me
				? {
						id: me.id,
						username: me.username,
						avatarUrl: userAvatar ?? me.avatarUrl,
						initials: (me.username ?? "?").charAt(0).toUpperCase(),
						elo: me.elo,
					}
				: null}
		/>
		<div class="vs">VS</div>
		<PlayerSlot
			state={selectedOpponent ? "filled" : "empty"}
			accent="opponent"
			player={selectedOpponent
				? {
						id: selectedOpponent.id,
						username: selectedOpponent.username,
						avatarUrl: selectedOpponent.avatarUrl,
						initials: (selectedOpponent.username ?? "?").charAt(0).toUpperCase(),
						elo: selectedOpponent.elo,
					}
				: null}
			onClear={clearOpponent}
		/>
	</div>
		<button type="button" class="cta hidden lg:block" disabled={!opponentId} onclick={startCompare}>
			{#if opponentId}
				⚔ {$t("compare.start_btn")}
			{:else}
				{$t("compare.start_btn_disabled")}
			{/if}
		</button>
	</div>

	<div class="lg:col-start-1 lg:row-start-2">
	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin h-8 w-8 border-2 border-warning border-t-transparent rounded-full"></div>
		</div>
	{:else}
		<SelectionGrid
			players={playerList}
			currentUserId={userId}
			selectedId={opponentId}
			onSelect={pickOpponent}
		/>
	{/if}
	</div>
</div>

<div class="cta-bar lg:hidden">
	<button
		type="button"
		class="cta"
		disabled={!opponentId}
		onclick={startCompare}
	>
		{#if opponentId}
			⚔ {$t("compare.start_btn")}
		{:else}
			{$t("compare.start_btn_disabled")}
		{/if}
	</button>
</div>

{#if toast}
	<div class="toast">{toast}</div>
{/if}

<style>
.slots {
	display: flex;
	align-items: stretch;
	gap: 8px;
	margin-bottom: 18px;
}
.vs {
	align-self: center;
	background: rgba(255,255,255,0.05);
	color: #9CA3AF;
	font-size: 11px;
	font-weight: 800;
	letter-spacing: 0.12em;
	padding: 4px 10px;
	border-radius: 999px;
}
.cta-bar {
	position: fixed;
	bottom: calc(env(safe-area-inset-bottom) + 130px);
	left: 0; right: 0;
	display: flex;
	justify-content: center;
	pointer-events: none;
	z-index: 30;
}
.cta {
	pointer-events: auto;
	min-width: 260px;
	padding: 14px 22px;
	border-radius: 999px;
	border: 0;
	font-size: 14px;
	font-weight: 800;
	letter-spacing: 0.04em;
	cursor: pointer;
	background: linear-gradient(135deg, #F59E0B, #D97706);
	color: #1A1F2A;
	box-shadow: 0 8px 24px rgba(245, 158, 11, 0.35);
	transition: transform .15s, opacity .15s;
}
.cta:disabled {
	background: rgba(255,255,255,0.06);
	color: #6B7280;
	box-shadow: none;
	cursor: not-allowed;
}
.cta:not(:disabled):hover { transform: translateY(-1px); }
.toast {
	position: fixed;
	bottom: calc(env(safe-area-inset-bottom) + 200px);
	left: 50%; transform: translateX(-50%);
	background: rgba(0,0,0,0.85);
	color: #FFFFFF;
	font-size: 12px;
	font-weight: 600;
	padding: 8px 16px;
	border-radius: 999px;
	border: 1px solid rgba(255,255,255,0.1);
	z-index: 40;
}
</style>
