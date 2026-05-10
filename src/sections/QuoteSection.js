export default class QuoteSection {
	constructor() {
		this.el = document.getElementById("quote-section");
		if (!this.el) return;

		this.textEl = this.el.querySelector("[data-quote]");
		this.text = this.textEl.textContent.trim();
		this.textEl.textContent = "";
		this.spans = [];
		this.#wrapLetters();
	}

	#wrapLetters() {
		for (const char of this.text) {
			const span = document.createElement("span");
			span.textContent = char;
			span.className = "quote-letter";
			this.textEl.appendChild(span);
			this.spans.push(span);
		}
	}

	/**
	 * @param {number} progress — 0 = quote just entering viewport, 1 = fully revealed
	 */
	update(progress) {
		if (!this.el) return;

		const p = Math.max(0, Math.min(progress, 1));

		// Reveal letters progressively
		const targetLetters = Math.floor(p * this.spans.length);
		for (let i = 0; i < this.spans.length; i++) {
			this.spans[i].style.opacity = i < targetLetters ? "1" : "0";
		}

		// Fade the whole section in/out
		this.el.style.opacity = p > 0.01 ? 1 : 0;
		this.el.style.visibility = p > 0.01 ? "" : "hidden";
	}
}
