import { posts } from "./posts";

const BASE = import.meta.env.BASE_URL;

function renderPostCard(post) {
	return `
		<a href="#blog/${post.slug}" class="blog-card" data-blog-link>
			<div class="blog-card-image">
				<img src="${BASE}photos/${post.image}" alt="${post.title}" loading="lazy" />
			</div>
			<div class="blog-card-body">
				<span class="blog-card-category">${post.category}</span>
				<h2 class="blog-card-title">${post.title}</h2>
				<p class="blog-card-excerpt">${post.excerpt}</p>
				<span class="blog-card-date">${post.date}</span>
			</div>
		</a>
	`;
}

function renderPostFull(post) {
	return `
		<article class="blog-post">
			<a href="#blog" class="blog-back">&larr; Back to Journal</a>
			<div class="blog-post-hero">
				<img src="${BASE}photos/${post.image}" alt="${post.title}" />
			</div>
			<div class="blog-post-meta">
				<span class="blog-card-category">${post.category}</span>
				<span class="blog-card-date">${post.date}</span>
			</div>
			<h1 class="blog-post-title">${post.title}</h1>
			<div class="blog-post-body">${post.body}</div>
		</article>
	`;
}

export function renderBlogIndex(container) {
	container.innerHTML = posts.map(renderPostCard).join("");
}

export function renderBlogPost(container, slug) {
	const post = posts.find((p) => p.slug === slug);
	if (!post) {
		container.innerHTML = `<p>Post not found. <a href="#blog">Back to Journal</a></p>`;
		return;
	}

	// Update page title for SEO
	document.title = `${post.title} — Helen V Photography`;
	const metaDesc = document.querySelector('meta[name="description"]');
	if (metaDesc) metaDesc.content = post.excerpt;

	container.innerHTML = renderPostFull(post);
}
