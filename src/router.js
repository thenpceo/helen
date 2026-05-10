import { renderBlogIndex, renderBlogPost } from "./blog/renderer";
import { renderStoreIndex, renderStoreProduct } from "./store/renderer";

const simpleRoutes = {
	"": "home",
	"#about": "about",
	"#store": "store",
	"#blog": "blog",
	"#book": "booking",
};

// Expose current page globally so WebGL systems can check it
window.__currentPage = "home";

export function initRouter() {
	const pages = document.querySelectorAll("[data-page]");
	const blogContainer = document.getElementById("blog-grid");
	const storeContainer = document.getElementById("store-grid");

	function navigate() {
		const hash = window.location.hash || "";

		const blogMatch = hash.match(/^#blog\/(.+)$/);
		const storeMatch = hash.match(/^#store\/(.+)$/);
		const active = blogMatch ? "blog"
			: storeMatch ? "store"
			: (simpleRoutes[hash] || "home");

		window.__currentPage = active;

		pages.forEach((p) => {
			const isActive = p.dataset.page === active;
			p.style.display = isActive ? "" : "none";
			p.setAttribute("aria-hidden", isActive ? "false" : "true");
		});

		// Blog
		if (active === "blog" && blogContainer) {
			if (blogMatch) {
				renderBlogPost(blogContainer, blogMatch[1]);
			} else {
				renderBlogIndex(blogContainer);
				document.title = "Journal — Helen V Photography";
			}
		}

		// Store
		if (active === "store" && storeContainer) {
			if (storeMatch) {
				renderStoreProduct(storeContainer, storeMatch[1]);
			} else {
				renderStoreIndex(storeContainer);
				document.title = "Store — Helen V Photography";
			}
		}

		if (active === "home") document.title = "Helen V Photography";
		if (active === "about") document.title = "About — Helen V Photography";
		if (active === "booking") document.title = "Book a Session — Helen V Photography";
	}

	window.addEventListener("hashchange", navigate);
	navigate();

	return { navigate };
}
