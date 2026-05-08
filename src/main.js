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

	function updateHero(scrollVal) {
		const heroExit = getHeroExit();
		window.__heroState.exitDistance = heroExit;

		// t goes 0 to 1 over the hero exit distance
		const t = Math.min(scrollVal / heroExit, 1);

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

	// Animation loop
	function animate() {
		portraitDriftX += (portraitDriftTargetX - portraitDriftX) * 0.08;
		portraitDriftY += (portraitDriftTargetY - portraitDriftY) * 0.08;

		const cardScroll = window.__heroState.scrollOffset || 0;
		updateHero(cardScroll);

		requestAnimationFrame(animate);
	}
	animate();
});
