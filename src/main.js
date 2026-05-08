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

	const HERO_EXIT = 500;

	// Expose hero state for cards — cards read this to know scroll position
	window.__heroState = {
		scrollOffset: 0,
		exitDistance: HERO_EXIT,
	};

	function lerp(a, b, t) {
		return a + (b - a) * t;
	}

	function updateHero(scrollVal) {
		const t = Math.min(scrollVal / HERO_EXIT, 1);
		const ease = t < 0.5
			? 4 * t * t * t
			: 1 - Math.pow(-2 * t + 2, 3) / 2;

		// Shared fade — matches the line fade
		const fadeOpacity = Math.max(0, 1 - ease * 1.3);

		// Portrait — fades slightly faster
		const portraitT = Math.min(t * 1.6, 1);
		const portraitEase = 1 - Math.pow(1 - portraitT, 3);
		const portraitY = -portraitEase * window.innerHeight * 0.6;
		const portraitScale = lerp(1, 0.4, portraitEase);
		const driftX = portraitDriftX * (1 - portraitT);
		const driftY = portraitDriftY * (1 - portraitT);
		portrait.style.transform = `translate(${driftX}px, ${portraitY + driftY}px) scale(${portraitScale})`;
		portrait.style.opacity = Math.max(0, 1 - ease * 1.5);

		// Name
		const nameEndY = -(window.innerHeight / 2) + 26;
		const nameEndX = -(window.innerWidth * 0.44) + 52;
		const nameY = lerp(0, nameEndY, ease);
		const nameX = lerp(0, nameEndX, ease);
		const nameScale = lerp(1, 0.42, ease);
		heroName.style.transform = `translate(${nameX}px, ${nameY}px) scale(${nameScale})`;
		heroName.style.opacity = fadeOpacity;

		// Lines
		const lineY = lerp(0, nameEndY * 0.8, ease);
		lineLeft.style.transform = `translateY(${lineY}px) scaleX(${lerp(1, 0, ease)})`;
		lineLeft.style.opacity = fadeOpacity;
		lineRight.style.transform = `translateY(${lineY}px) scaleX(${lerp(1, 0, ease)})`;
		lineRight.style.opacity = fadeOpacity;

		// Nav links
		const navEndY = nameEndY;
		const navEndX = (window.innerWidth * 0.44) - 120;
		const navY = lerp(0, navEndY, ease);
		const navX = lerp(0, navEndX, ease);
		heroNav.style.transform = `translate(${navX}px, ${navY}px) scale(${lerp(1, 0.85, ease)})`;
		heroNav.style.opacity = fadeOpacity;

		// Hero visibility
		if (t >= 1) {
			hero.style.visibility = "hidden";
			hero.style.pointerEvents = "none";
		} else {
			hero.style.visibility = "";
			hero.style.pointerEvents = "";
		}

		// Nav bar
		if (t >= 0.85) {
			navBar.classList.add("visible");
			navBar.style.opacity = (t - 0.85) / 0.15;
		} else {
			navBar.classList.remove("visible");
			navBar.style.opacity = 0;
		}
	}

	// Animation loop — just handles portrait drift and reads card scroll for hero
	function animate() {
		portraitDriftX += (portraitDriftTargetX - portraitDriftX) * 0.08;
		portraitDriftY += (portraitDriftTargetY - portraitDriftY) * 0.08;

		// Read the cards' smooth scroll value to drive hero
		const cardScroll = window.__heroState.scrollOffset || 0;
		updateHero(cardScroll);

		requestAnimationFrame(animate);
	}
	animate();
});
