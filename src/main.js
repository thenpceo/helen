import Three from "./core/Three";
import QuoteSection from "./sections/QuoteSection";
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
	const heroBio = hero.querySelector(".hero-bio");
	const heroTagline = hero.querySelector(".hero-tagline");
	const heroLocation = hero.querySelector(".hero-location");
	const heroScrollHint = hero.querySelector(".hero-scroll-hint");

	// Portrait mouse drift
	let portraitDriftX = 0;
	let portraitDriftY = 0;
	let portraitDriftTargetX = 0;
	let portraitDriftTargetY = 0;

	window.addEventListener("mousemove", (e) => {
		portraitDriftTargetX = ((e.clientX / window.innerWidth) * 2 - 1) * 15;
		portraitDriftTargetY = ((e.clientY / window.innerHeight) * 2 - 1) * 15;
	});

	// Hero exit distance matches screen height so hero and cards transition
	// is perfectly continuous — cards start appearing as hero fades
	function getHeroExit() {
		return window.innerHeight * 0.7;
	}

	// Expose hero state for cards
	window.__heroState = {
		scrollOffset: 0,
		exitDistance: getHeroExit(),
	};

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	// Clear CSS animations so JS can control opacity/transform
	let animationsCleared = false;
	function clearAnimations() {
		if (animationsCleared) return;
		animationsCleared = true;
		[portrait, heroName, lineLeft, lineRight, heroNav, heroBio, heroTagline, heroLocation, heroScrollHint].forEach((el) => {
			el.style.animation = "none";
		});
	}

	// Clear portrait animation as soon as it finishes so mouse drift works immediately
	portrait.addEventListener("animationend", () => {
		portrait.style.animation = "none";
	});

	function updateHero(scrollVal) {
		const heroExit = getHeroExit();
		window.__heroState.exitDistance = heroExit;

		// t goes 0 to 1 over the hero exit distance
		const t = Math.min(scrollVal / heroExit, 1);

		// Clear CSS entrance animations once user starts scrolling
		if (t > 0.01) clearAnimations();

		// Simple smooth fade — all elements use this
		const fade = Math.max(0, 1 - t);

		// Gentle upward drift as you scroll — all elements move up together
		const drift = -t * window.innerHeight * 0.15;

		// Portrait
		const driftX = portraitDriftX * fade;
		const driftY = portraitDriftY * fade;
		portrait.style.transform = `translate(${driftX}px, ${drift + driftY}px)`;
		portrait.style.opacity = fade;

		// Name
		heroName.style.transform = `translateY(${drift}px)`;
		heroName.style.opacity = fade;

		// Lines
		lineLeft.style.transform = `translateY(${drift}px) scaleX(${fade})`;
		lineLeft.style.opacity = fade;
		lineRight.style.transform = `translateY(${drift}px) scaleX(${fade})`;
		lineRight.style.opacity = fade;

		// Nav links
		heroNav.style.transform = `translateY(${drift}px)`;
		heroNav.style.opacity = fade;

		// Additional elements
		heroBio.style.transform = `translateY(${drift}px)`;
		heroBio.style.opacity = fade;
		heroTagline.style.transform = `translateY(${drift}px)`;
		heroTagline.style.opacity = fade;
		heroLocation.style.transform = `translateY(${drift}px)`;
		heroLocation.style.opacity = fade;
		heroScrollHint.style.opacity = Math.max(0, 1 - t * 3);

		// Hero visibility
		if (t >= 1) {
			hero.style.visibility = "hidden";
			hero.style.pointerEvents = "none";
		} else {
			hero.style.visibility = "";
			hero.style.pointerEvents = "";
		}

		// Nav bar fades in as hero fades out
		if (t >= 0.7) {
			const navT = (t - 0.7) / 0.3;
			navBar.classList.add("visible");
			navBar.style.opacity = navT;
		} else {
			navBar.classList.remove("visible");
			navBar.style.opacity = 0;
		}
	}

	// Quote section
	const quoteSection = new QuoteSection();

	// Animation loop
	function animate() {
		portraitDriftX += (portraitDriftTargetX - portraitDriftX) * 0.08;
		portraitDriftY += (portraitDriftTargetY - portraitDriftY) * 0.08;

		const cardScroll = window.__heroState.scrollOffset || 0;
		updateHero(cardScroll);

		// Update quote + depth gallery based on scroll progress past cards
		const lc = three.liquidCards;
		const dg = three.depthGallery;
		if (lc && lc.cardMaxScroll > 0) {
			const pastCards = lc.scroll.current - lc.cardMaxScroll;

			// Quote: appears in first 1.5 screens past cards
			const quoteProgress = Math.max(0, pastCards / (lc.height * 1.2));
			quoteSection.update(quoteProgress);

			// Depth gallery: starts after quote (1.5 screens), spans 8 screens
			const depthStart = lc.height * 2;
			const depthSpan = lc.height * 7;
			const depthProgress = Math.max(0, (pastCards - depthStart) / depthSpan);

			if (dg) {
				const depthActive = depthProgress > 0 && depthProgress < 1;
				dg.setActive(depthActive);
				if (depthActive) {
					dg.update(depthProgress);
				}
				// Fade out quote when depth gallery is active
				if (depthProgress > 0.05) {
					quoteSection.update(Math.max(0, 1 - depthProgress * 5));
				}
			}
		}

		requestAnimationFrame(animate);
	}
	animate();
});
