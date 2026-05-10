const routes = {
	"": "home",
	"#about": "about",
	"#blog": "blog",
	"#store": "store",
	"#book": "booking",
};

export function initRouter() {
	const pages = document.querySelectorAll("[data-page]");

	function navigate() {
		const hash = window.location.hash || "";
		const active = routes[hash] || "home";

		pages.forEach((p) => {
			const isActive = p.dataset.page === active;
			p.style.display = isActive ? "" : "none";
			p.setAttribute("aria-hidden", isActive ? "false" : "true");
		});

		// Scroll to top on page change
		window.scrollTo(0, 0);
	}

	window.addEventListener("hashchange", navigate);
	navigate();

	return { navigate };
}
