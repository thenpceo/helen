import { storeProducts } from "./products";

const BASE = import.meta.env.BASE_URL;

function renderProductCard(product) {
	const startPrice = product.sizes[0]?.price || 0;
	return `
		<a href="#store/${product.id}" class="store-card" data-store-link>
			<div class="store-card-image">
				<img src="${BASE}photos/${product.image}" alt="${product.title}" loading="lazy" />
			</div>
			<div class="store-card-body">
				<h2 class="store-card-title">${product.title}</h2>
				<span class="store-card-price">From $${startPrice}</span>
			</div>
		</a>
	`;
}

function renderProductDetail(product) {
	const sizeOptions = product.sizes
		.map((s, i) => `<option value="${i}" ${i === 0 ? "selected" : ""}>${s.name} — $${s.price}</option>`)
		.join("");
	const frameOptions = product.framing
		.map((f, i) => `<option value="${i}" ${i === 0 ? "selected" : ""}>${f.name}${f.priceAdd > 0 ? ` (+$${f.priceAdd})` : ""}</option>`)
		.join("");

	return `
		<div class="store-product">
			<a href="#store" class="blog-back">&larr; Back to Store</a>
			<div class="store-product-layout">
				<div class="store-product-image">
					<img src="${BASE}photos/${product.image}" alt="${product.title}" />
				</div>
				<div class="store-product-info">
					<h1 class="store-product-title">${product.title}</h1>
					<p class="store-product-desc">${product.description}</p>

					<div class="store-product-options">
						<label class="store-label">Size</label>
						<select id="store-size" class="store-select">${sizeOptions}</select>

						<label class="store-label">Framing</label>
						<select id="store-frame" class="store-select">${frameOptions}</select>

						<div class="store-product-total">
							<span class="store-label">Total</span>
							<span id="store-total" class="store-total-price">$${product.sizes[0].price}</span>
						</div>

						<button id="store-order-btn" class="store-order-btn">Order Print</button>
						<p class="store-fulfillment">Printed and shipped by ThePrintSpace. Ships worldwide.</p>
					</div>
				</div>
			</div>
		</div>
	`;
}

function bindProductEvents(product) {
	const sizeSelect = document.getElementById("store-size");
	const frameSelect = document.getElementById("store-frame");
	const totalEl = document.getElementById("store-total");
	const orderBtn = document.getElementById("store-order-btn");

	function updateTotal() {
		const size = product.sizes[parseInt(sizeSelect.value)];
		const frame = product.framing[parseInt(frameSelect.value)];
		const total = size.price + frame.priceAdd;
		totalEl.textContent = `$${total}`;
	}

	sizeSelect?.addEventListener("change", updateTotal);
	frameSelect?.addEventListener("change", updateTotal);

	orderBtn?.addEventListener("click", () => {
		const size = product.sizes[parseInt(sizeSelect.value)];
		const frame = product.framing[parseInt(frameSelect.value)];
		const total = size.price + frame.priceAdd;
		alert(`Order placed! ${product.title}, ${size.name}, ${frame.name} — $${total}\n\nThePrintSpace integration coming soon. For now, email Helen.W.photo@gmail.com with your order details.`);
	});
}

export function renderStoreIndex(container) {
	container.innerHTML = storeProducts.map(renderProductCard).join("");
}

export function renderStoreProduct(container, productId) {
	const product = storeProducts.find((p) => p.id === productId);
	if (!product) {
		container.innerHTML = `<p>Product not found. <a href="#store">Back to Store</a></p>`;
		return;
	}

	document.title = `${product.title} — Helen V Photography Store`;
	container.innerHTML = renderProductDetail(product);
	bindProductEvents(product);
}
