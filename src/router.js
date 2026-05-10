import { renderBlogIndex, renderBlogPost } from "./blog/renderer";

const simpleRoutes = {
	"": "home",
	"#about": "about",
	"#store": "store",
	"#blog": "blog",
	"#book": "booking",
};

export function initRouter() {
	const pages = document.querySelectorAll("[data-page]");
	const blogContainer = document.getElementById("blog-grid");

	function navigate() {
		const hash = window.location.hash || "";

		// Check for blog post route: #blog/slug
		const blogMatch = hash.match(/^#blog\/(.+)$/);
		const active = blogMatch ? "blog" : (simpleRoutes[hash] || "home");

		pages.forEach((p) => {
			const isActive = p.dataset.page === active;
			p.style.display = isActive ? "" : "none";
			p.setAttribute("aria-hidden", isActive ? "false" : "true");
		});

		// Render blog content
		if (active === "blog" && blogContainer) {
			if (blogMatch) {
				renderBlogPost(blogContainer, blogMatch[1]);
			} else {
				renderBlogIndex(blogContainer);
				document.title = "Journal — Helen V Photography";
			}
		}

		// Reset title for non-blog pages
		if (active !== "blog") {
			document.title = "Helen V Photography";
		}
	}

	window.addEventListener("hashchange", navigate);
	navigate();

	return { navigate };
}
