<script>
import { cubicOut } from "svelte/easing";
import { tweened } from "svelte/motion";

/**
 * Animates a numeric value counting up from 0 to `value` using
 * `tweened`. Jumps straight to the final value under
 * `prefers-reduced-motion` (or when `reduced` is passed in) instead of
 * animating.
 *
 * @type {{
 *   value: number,
 *   decimals?: number,
 *   suffix?: string,
 *   reduced?: boolean,
 *   duration?: number,
 * }}
 */
let {
	value = 0,
	decimals = 0,
	suffix = "",
	reduced = false,
	duration = 900,
} = $props();

const display = tweened(0, { easing: cubicOut });

$effect(() => {
	display.set(value, { duration: reduced ? 0 : duration });
});

const formatted = $derived($display.toFixed(decimals));
</script>

<span>{formatted}{suffix}</span>
