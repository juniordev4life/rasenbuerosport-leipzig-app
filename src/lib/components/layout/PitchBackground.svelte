<!--
	The mown pitch behind design B: grass stripes plus chalk markings
	(touchlines, both penalty areas, halfway line, centre circle). A fixed
	layer, so it stays put while the page scrolls — iOS ignores
	`background-attachment: fixed`. Hidden in design A. Purely decorative.
-->
<div class="pitch" aria-hidden="true">
	<div class="touchline"></div>
	<div class="area area-top"><span class="goal-area"></span><span class="arc"></span></div>
	<div class="halfway"></div>
	<div class="centre-circle"></div>
	<div class="centre-spot"></div>
	<div class="area area-bottom"><span class="goal-area"></span><span class="arc"></span></div>
</div>

<style>
.pitch {
	--chalk: color-mix(in srgb, var(--color-white) 55%, transparent);
	--chalk-width: 3px;
	position: fixed;
	inset: 0;
	/* Below the page content, above the body's base colour. */
	z-index: -1;
	pointer-events: none;
	background: var(--page-bg);
	overflow: hidden;
}

:global([data-variant="a"]) .pitch {
	display: none;
}

.touchline {
	position: absolute;
	inset: -10px 10px;
	border: var(--chalk-width) solid var(--chalk);
}

.area {
	position: absolute;
	left: 50%;
	width: 210px;
	height: 100px;
	transform: translateX(-50%);
	border: var(--chalk-width) solid var(--chalk);
}

.area-top {
	top: -3px;
}

.area-bottom {
	bottom: -3px;
}

.goal-area {
	position: absolute;
	left: 50%;
	width: 110px;
	height: 38px;
	transform: translateX(-50%);
	border: var(--chalk-width) solid var(--chalk);
}

.area-top .goal-area {
	top: -3px;
}

.area-bottom .goal-area {
	bottom: -3px;
}

/* The "D" outside the penalty area: the visible half of a circle. */
.arc {
	position: absolute;
	left: 50%;
	width: 86px;
	height: 86px;
	transform: translateX(-50%);
	border: var(--chalk-width) solid var(--chalk);
	border-radius: 50%;
	clip-path: inset(50% 0 0 0);
}

.area-top .arc {
	bottom: -46px;
	clip-path: inset(56% 0 0 0);
}

.area-bottom .arc {
	top: -46px;
	clip-path: inset(0 0 56% 0);
}

.halfway {
	position: absolute;
	top: 50%;
	left: 10px;
	right: 10px;
	border-top: var(--chalk-width) solid var(--chalk);
}

.centre-circle {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 148px;
	height: 148px;
	transform: translate(-50%, -50%);
	border: var(--chalk-width) solid var(--chalk);
	border-radius: 50%;
}

.centre-spot {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 10px;
	height: 10px;
	transform: translate(-50%, -50%);
	background: var(--chalk);
	border-radius: 50%;
}
</style>
