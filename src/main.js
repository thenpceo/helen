import Three from "./core/Three";
import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
	const container = document.querySelector("#app");
	const three = new Three(container);
	three.run();

	// Elements
	const hero = document.getElementById("hero");
	const navBar = document.getElementById("nav-bar");
	const portrait = hero.querySelector(".hero-portrait");
	const heroName = hero.querySelector(".hero-name");
	const lineLeft = hero.querySelector(".hero-line-left");
	const lineRight = hero.querySelector(".hero-line-right");
	const heroNav = hero.querySelector(".hero-nav");

	let scrollOffset = 0;
	let smoothScrollOffset = 0;

	const HERO_EXIT = 500; // px of scroll to fully transition hero to nav

	// Expose for cards system
	window.__heroState = { scrollOffset: 0, exitDistance: HERO_EXIT };

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	function updateHero() {
		const t = Math.min(smoothScrollOffset / HERO_EXIT, 1);
		// Smooth ease — cubic
		const ease = t < 0.5
			? 4 * t * t * t
			: 1 - Math.pow(-2 * t + 2, 3) / 2;

		// --- Portrait: flies up faster ---
		const portraitT = Math.min(t * 1.6, 1);
		const portraitEase = 1 - Math.pow(1 - portraitT, 3);
		const portraitY = -portraitEase * window.innerHeight * 0.6;
		const portraitScale = lerp(1, 0.4, portraitEase);
		const portraitOpacity = Math.max(0, 1 - portraitT * 1.4);
		portrait.style.transform = `translateY(${portraitY}px) scale(${portraitScale})`;
		portrait.style.opacity = portraitOpacity;

		// --- Name: moves from center to nav bar position ---
		// Start position: center of screen (flex centered)
		// End position: top-left (nav bar)
		const nameStartY = 0;
		const nameEndY = -(window.innerHeight / 2) + 26; // move to top
		const nameY = lerp(nameStartY, nameEndY, ease);
		const nameStartX = 0;
		const nameEndX = -(window.innerWidth * 0.44) + 52; // move to left edge
		const nameX = lerp(nameStartX, nameEndX, ease);
		const nameScale = lerp(1, 0.42, ease);
		const nameOpacity = t > 0.92 ? Math.max(0, 1 - (t - 0.92) / 0.08) : 1;
		heroName.style.transform = `translate(${nameX}px, ${nameY}px) scale(${nameScale})`;
		heroName.style.opacity = nameOpacity;

		// --- Lines: shrink and move up ---
		const lineOpacity = Math.max(0, 1 - ease * 1.3);
		const lineY = lerp(0, nameEndY * 0.8, ease);
		lineLeft.style.transform = `translateY(${lineY}px) scaleX(${lerp(1, 0, ease)})`;
		lineLeft.style.opacity = lineOpacity;
		lineRight.style.transform = `translateY(${lineY}px) scaleX(${lerp(1, 0, ease)})`;
		lineRight.style.opacity = lineOpacity;

		// --- Nav links: move from center-right to top-right ---
		const navEndY = nameEndY;
		const navEndX = (window.innerWidth * 0.44) - 120;
		const navY = lerp(0, navEndY, ease);
		const navX = lerp(0, navEndX, ease);
		const navScale = lerp(1, 0.85, ease);
		const navOpacity = t > 0.92 ? Math.max(0, 1 - (t - 0.92) / 0.08) : 1;
		heroNav.style.transform = `translate(${navX}px, ${navY}px) scale(${navScale})`;
		heroNav.style.opacity = navOpacity;

		// --- Hero visibility ---
		if (t >= 1) {
			hero.style.visibility = "hidden";
			hero.style.pointerEvents = "none";
		} else {
			hero.style.visibility = "";
			hero.style.pointerEvents = "";
		}

		// --- Nav bar: cross-fade in as hero elements fade out ---
		if (t >= 0.85) {
			const navT = (t - 0.85) / 0.15;
			navBar.classList.add("visible");
			navBar.style.opacity = navT;
		} else {
			navBar.classList.remove("visible");
			navBar.style.opacity = 0;
		}
	}

	// Smooth scroll animation loop
	function animateScroll() {
		smoothScrollOffset += (scrollOffset - smoothScrollOffset) * 0.1;
		// Snap when close enough
		if (Math.abs(scrollOffset - smoothScrollOffset) < 0.5) {
			smoothScrollOffset = scrollOffset;
		}
		window.__heroState.scrollOffset = smoothScrollOffset;
		updateHero();
		requestAnimationFrame(animateScroll);
	}
	animateScroll();

	// Wheel
	window.addEventListener("wheel", (e) => {
		if (e.target instanceof Element && e.target.closest(".lil-gui")) return;
		// Only consume scroll for hero if hero isn't fully exited
		if (scrollOffset < HERO_EXIT) {
			scrollOffset = Math.max(0, scrollOffset + e.deltaY * 1.08);
			// Don't go past HERO_EXIT from hero scrolling alone
			if (scrollOffset > HERO_EXIT) scrollOffset = HERO_EXIT;
		}
	}, { passive: true });

	// Touch
	let touchY = 0;
	window.addEventListener("touchstart", (e) => {
		if (e.touches.length) touchY = e.touches[0].clientY;
	}, { passive: true });

	window.addEventListener("touchmove", (e) => {
		if (!e.touches.length) return;
		const delta = touchY - e.touches[0].clientY;
		touchY = e.touches[0].clientY;
		if (scrollOffset < HERO_EXIT) {
			scrollOffset = Math.max(0, scrollOffset + delta * 2.1);
			if (scrollOffset > HERO_EXIT) scrollOffset = HERO_EXIT;
		}
	}, { passive: true });

	// Keyboard
	window.addEventListener("keydown", (e) => {
		if (e.key === "Home") {
			scrollOffset = 0;
		}
	});
});
