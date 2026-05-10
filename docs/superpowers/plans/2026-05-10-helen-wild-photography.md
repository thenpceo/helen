# Helen Wild Photography — Full Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the current single-page 3D relief + card gallery into a full photography portfolio site with categorized depth gallery, booking, blog, and print store.

**Architecture:** Vite SPA with client-side hash router. All pages share the same relief WebGL background. New sections (depth gallery, quote, booking, about, blog, store) are scroll-triggered or routed HTML overlays on top of the WebGL canvas. ThePrintSpace API handles print fulfillment via a lightweight serverless function (Vercel API route).

**Tech Stack:** Vite, Three.js, Tailwind CSS, ThePrintSpace REST API, Cal.com embed, Vercel (hosting + serverless functions)

**Domain:** www.helenvphoto.com (Vercel custom domain)

---

## Project Structure (Target)

```
src/
  main.js                    # Entry point, router setup
  router.js                  # Simple hash-based SPA router
  style.css                  # Global styles
  core/                      # Existing Three.js/WebGL (unchanged)
  cards/LiquidCards.js        # Existing card gallery (fix maximized view)
  scenes/Scene.js             # Existing relief scene (unchanged)
  sections/
    QuoteSection.js           # Letter-by-letter animated text
    DepthGallery.js           # 3D fly-through categorized gallery
    DepthGalleryShaders.js    # Shaders for depth gallery
  pages/
    HomePage.js               # Orchestrates hero + cards + quote + depth
    AboutPage.js              # About Helen
    BlogPage.js               # Blog index
    BlogPost.js               # Individual blog post
    StorePage.js              # Print store listing
    StoreProduct.js           # Individual product + checkout
    BookingPage.js            # Cal.com embed
  store/
    printspace.js             # ThePrintSpace API client
    products.js               # Product data (5 selected photos)
  blog/
    posts/                    # Static markdown blog posts
    renderer.js               # Markdown → HTML renderer
public/
  photos/                     # Existing 34 photos
  categories/                 # Category hero images (placeholders for now)
  store/                      # High-res store images
api/
  printspace/
    products.js               # Vercel serverless: proxy product queries
    orders.js                 # Vercel serverless: proxy order creation
```

---

## Phase 1: Fix Maximized Image View (Immediate)

### Task 1.1: Remove color processing from expanded card shader

**Files:**
- Modify: `src/cards/LiquidCards.js` (fragment shader + expand logic)

**Problem:** The expanded/fullscreen image view still shows color processing (contrast/saturation from the shader's texture color space handling). The fragment shader applies `coverTextureUv` cropping and Three.js applies sRGB linearization + re-encoding through the renderer's `outputColorSpace`.

- [ ] **Step 1:** Add a `uExpanded` uniform to the card fragment shader that bypasses all color processing when 1.0:

```glsl
uniform float uExpanded;
// In main():
if (uExpanded > 0.5) {
    // Raw texture output, no lift/washout/hover processing
    vec2 coverUv = coverTextureUv(vUv, uImageSize, uPlaneSize);
    gl_FragColor = texture2D(uTexture, coverUv);
    return;
}
```

- [ ] **Step 2:** Add `uExpanded: { value: 0 }` to `createCardMaterial` uniforms

- [ ] **Step 3:** In `LiquidCard.updateExpand()`, set `this.imageMaterial.uniforms.uExpanded.value = eased`

- [ ] **Step 4:** Test: click an image, verify it displays with no contrast/saturation/lift effects — true to original JPEG

- [ ] **Step 5:** Commit: `fix: display raw image in expanded card view`

---

## Phase 2: Quote Section (Below Cards)

### Task 2.1: Create scroll-triggered letter-by-letter text animation

**Files:**
- Create: `src/sections/QuoteSection.js`
- Modify: `index.html` (add quote container)
- Modify: `src/style.css` (quote styles)
- Modify: `src/main.js` (initialize quote section)

The quote section is an HTML overlay (z-index above canvas, below nav). It appears after the card gallery ends. Text animates in one letter at a time as the user scrolls into view.

- [ ] **Step 1:** Add quote container to `index.html` after the hero section:

```html
<section id="quote-section" class="quote-section">
    <div class="quote-inner">
        <p class="quote-text" data-quote>Every frame holds a world most people walk past without seeing.</p>
    </div>
</section>
```

- [ ] **Step 2:** Create `src/sections/QuoteSection.js`:

```js
export default class QuoteSection {
    constructor() {
        this.el = document.getElementById('quote-section');
        this.textEl = this.el.querySelector('[data-quote]');
        this.text = this.textEl.textContent;
        this.textEl.textContent = '';
        this.revealed = 0;
        this.#wrapLetters();
    }

    #wrapLetters() {
        this.spans = [];
        for (const char of this.text) {
            const span = document.createElement('span');
            span.textContent = char;
            span.className = 'quote-letter';
            this.textEl.appendChild(span);
            this.spans.push(span);
        }
    }

    // Called from main.js animation loop with current card scroll value
    update(scrollVal, viewportHeight) {
        // Quote starts revealing after cards section
        // scrollVal = total scroll from cards system
        // Determine when quote section enters viewport
        const rect = this.el.getBoundingClientRect();
        if (rect.top > viewportHeight || rect.bottom < 0) return;

        const progress = 1 - (rect.top / viewportHeight);
        const targetLetters = Math.floor(progress * this.spans.length * 1.5);
        const clamped = Math.min(targetLetters, this.spans.length);

        for (let i = 0; i < this.spans.length; i++) {
            this.spans[i].style.opacity = i < clamped ? '1' : '0';
        }
    }
}
```

- [ ] **Step 3:** Add CSS styles for the quote section:

```css
.quote-section {
    position: relative;
    z-index: 10;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.quote-inner {
    max-width: 800px;
    padding: 0 clamp(24px, 6vw, 80px);
}

.quote-text {
    font-family: 'Oceanside Typewriter', serif;
    font-size: clamp(24px, 3.5vw, 44px);
    line-height: 1.6;
    color: var(--ui-color);
    letter-spacing: 0.04em;
}

.quote-letter {
    opacity: 0;
    transition: opacity 0.15s ease;
}
```

- [ ] **Step 4:** Wire into `main.js` — the quote section needs to be positioned below the card gallery in scroll space. Since cards are in WebGL (not DOM scroll), the quote section must be positioned absolutely and moved via JS based on scroll state.

- [ ] **Step 5:** Test: scroll past all cards, verify quote text animates in letter by letter

- [ ] **Step 6:** Commit: `feat: add scroll-triggered quote section with letter animation`

---

## Phase 3: 3D Depth Gallery (Categorized)

### Task 3.1: Port codrops depth gallery effect

**Files:**
- Create: `src/sections/DepthGallery.js`
- Create: `src/sections/DepthScroll.js` (scroll-to-Z mapping)
- Modify: `src/core/Three.js` (add depth gallery to render pipeline)
- Modify: `index.html` (add category label overlay)
- Modify: `src/style.css` (category label styles)

**Architecture (from codrops research):**
- Images are `THREE.PlaneGeometry` meshes positioned along Z-axis with `planeGap` spacing
- Scroll maps to camera Z position: `cameraZ = startZ - scroll * 0.01`
- Adjacent planes cross-fade based on camera proximity
- Category label (HTML overlay) changes when foreground image changes

- [ ] **Step 1:** Create category data with placeholder images:

```js
const CATEGORIES = [
    { name: 'Beachside', images: ['dsc_3043.jpg', 'dsc_2959.jpg', 'dsc_7323.jpg'] },
    { name: 'Waterfall', images: ['dsc_2705.jpg', 'dsc_9631.jpg'] },
    { name: 'Scenic View', images: ['dsc_3005.jpg', 'dsc_4753.jpg', 'dsc_1191-2.jpg'] },
    { name: 'Wildlife', images: ['dsc_2393.jpg', 'dsc_2441.jpg'] },
    { name: 'Retreats', images: ['dsc_2635.jpg', 'dsc_3663-2.jpg', 'dsc_5676.jpg'] },
    { name: 'Portraits', images: ['dsc_3569.jpg', 'dsc_3580.jpg'] },
    { name: 'Nature', images: ['dsc_4722.jpg', 'dsc_9290.jpg', 'dsc_9311.jpg', 'dsc_9383.jpg'] },
];
```

- [ ] **Step 2:** Create `DepthGallery.js` — a Three.js scene with image planes spaced along Z-axis, scroll-driven camera movement, cross-fade between planes, and an event emitter for category changes

- [ ] **Step 3:** Add HTML category label overlay that updates when the current foreground image changes category

- [ ] **Step 4:** Integrate into the render pipeline in `Three.js` — depth gallery renders into `watercolorOverlay.outputTarget` (same as cards) BEFORE postprocessing, so the relief background shows behind the images and all postprocessing effects (bloom, tone mapping, chromatic aberration, film noise) apply to the depth gallery images too. Same pattern as the card render in `#render()`:

```js
// Render depth gallery into same target as relief + cards
this.renderer.setRenderTarget(this.watercolorOverlay.outputTarget);
this.renderer.autoClear = false;
this.renderer.clearDepth();
this.renderer.render(this.depthGallery.scene, this.depthGallery.camera);
this.renderer.autoClear = true;
this.renderer.setRenderTarget(null);
```

- [ ] **Step 5:** Test: scroll past cards and quote, enter depth gallery, verify images fly toward viewer with category labels

- [ ] **Step 6:** Commit: `feat: add 3D depth gallery with category labels`

---

## Phase 4: Client-Side Router + Page Shell

### Task 4.1: Add hash-based SPA router

**Files:**
- Create: `src/router.js`
- Modify: `src/main.js` (mount router)
- Modify: `index.html` (add page containers)

The router shows/hides page containers based on URL hash. The home page is the existing hero + cards + quote + depth. Other pages (about, blog, store, booking) overlay the relief background.

- [ ] **Step 1:** Create `src/router.js`:

```js
const routes = {
    '': 'home',
    '#about': 'about',
    '#gallery': 'gallery',
    '#blog': 'blog',
    '#store': 'store',
    '#book': 'booking',
};

export function initRouter() {
    const pages = document.querySelectorAll('[data-page]');
    function navigate() {
        const hash = window.location.hash || '';
        const active = routes[hash] || 'home';
        pages.forEach(p => {
            p.style.display = p.dataset.page === active ? '' : 'none';
        });
    }
    window.addEventListener('hashchange', navigate);
    navigate();
}
```

- [ ] **Step 2:** Wrap existing hero/cards in `<div data-page="home">`, add empty containers for other pages

- [ ] **Step 3:** Update nav links to use hash routes

- [ ] **Step 4:** Test: clicking About/Gallery/Book/Store links switches pages, home page works as before

- [ ] **Step 5:** Commit: `feat: add hash-based SPA router`

---

## Phase 5: Booking Page (Cal.com)

### Task 5.1: Embed Cal.com scheduling widget

**Files:**
- Modify: `index.html` (add booking page container)
- Modify: `src/style.css` (booking page styles)

- [ ] **Step 1:** Add booking page container with Cal.com embed:

```html
<div data-page="booking" style="display:none">
    <div class="page-content">
        <h1 class="page-title">Book a Session</h1>
        <p class="page-subtitle">Schedule an introductory call to discuss your photography needs.</p>
        <div style="width:100%;height:100%;overflow:scroll" id="my-cal-inline-photo-intro-call"></div>
        <!-- Cal.com embed loaded via script in page init -->
    </div>
</div>
```

- [ ] **Step 2:** Style the booking page (centered content, editorial typography)

- [ ] **Step 3:** Test: navigate to #book, verify Cal.com widget loads and is interactive

- [ ] **Step 4:** Commit: `feat: add Cal.com booking page`

---

## Phase 6: About Page

### Task 6.1: Create About Helen page

**Files:**
- Modify: `index.html` (add about page container)
- Modify: `src/style.css` (about page styles)

- [ ] **Step 1:** Add about page with placeholder content:
  - Portrait photo (reuse helen-portrait.png)
  - Bio paragraphs (placeholder text about her story, style, background)
  - Passions timeline
  - Contact: Helen.W.photo@gmail.com

- [ ] **Step 2:** Style with editorial layout (asymmetric, generous whitespace, Oceanside Typewriter headings, Space Grotesk body)

- [ ] **Step 3:** Test: navigate to #about, verify layout and content

- [ ] **Step 4:** Commit: `feat: add About page`

---

## Phase 7: Blog

### Task 7.1: Create blog index and post renderer

**Files:**
- Create: `src/blog/posts/` (3 placeholder markdown posts)
- Create: `src/blog/renderer.js` (markdown to HTML)
- Modify: `index.html` (blog page containers)
- Modify: `src/style.css` (blog styles)
- Modify: `src/router.js` (handle #blog and #blog/slug routes)

- [ ] **Step 1:** Create 3 placeholder blog posts as JS modules (avoiding markdown parser dependency):

```js
// src/blog/posts/index.js
export const posts = [
    {
        slug: 'chasing-waterfalls-hawaii',
        title: 'Chasing Waterfalls in Hawai\'i',
        date: '2025-12-15',
        excerpt: 'A week spent hiking...',
        category: 'Trips',
        body: `<p>Full article HTML here...</p>`,
        image: 'dsc_2705.jpg',
    },
    // ... 2 more posts
];
```

- [ ] **Step 2:** Create blog index page (grid of post cards with image, title, date, excerpt)

- [ ] **Step 3:** Create blog post page (full article with SEO meta tags)

- [ ] **Step 4:** Add `<meta>` tag injection for SEO (title, description, og:image per post)

- [ ] **Step 5:** Test: navigate to #blog, click a post, verify rendering

- [ ] **Step 6:** Commit: `feat: add blog with static posts and SEO meta`

---

## Phase 8: Store (ThePrintSpace)

### Task 8.1: Create ThePrintSpace API client

**Files:**
- Create: `api/printspace/products.js` (Vercel serverless function)
- Create: `api/printspace/orders.js` (Vercel serverless function)
- Create: `src/store/printspace.js` (frontend API client)
- Create: `src/store/products.js` (product data)

**API Details:**
- Base URL: `https://api.creativehub.io`
- Auth header: `Authorization: ApiKey production-NClQ0TwMl4dRdkKF0DXfYmYw2qbKgSld`
- Key endpoints:
  - `POST /api/v1/products/query` — list products
  - `POST /api/v1/orders/embryonic` — create draft order
  - `POST /api/v1/orders/confirmed` — finalize order
  - `POST /api/v1/deliveryoptions/query` — shipping options

- [ ] **Step 1:** Create Vercel serverless functions that proxy API requests (keeps API key server-side)

- [ ] **Step 2:** Create product data for 5 selected photos:
  - `dsc_3408.jpg` — Golden Hour Surfers
  - `dsc_3569.jpg` — Red Rock Solitude
  - `dsc_3663-2.jpg` — Kelingking Cove
  - `dsc_0300-2.jpg` — Taro Valley
  - `dsc_4753.jpg` — Waimea Canyon

- [ ] **Step 3:** Create products in ThePrintSpace via API (upload images, set sizes/pricing)

- [ ] **Step 4:** Commit: `feat: add ThePrintSpace API client and serverless proxy`

### Task 8.2: Create store UI

**Files:**
- Modify: `index.html` (store page containers)
- Modify: `src/style.css` (store styles)
- Modify: `src/router.js` (handle #store and #store/product routes)

- [ ] **Step 1:** Store listing page — grid of 5 photos with titles and starting prices

- [ ] **Step 2:** Product detail page — large image, size selector, framing options, price display, "Order" button

- [ ] **Step 3:** Order flow — collect shipping details, create embryonic order, confirm order, show confirmation

- [ ] **Step 4:** Test: browse store, select product, complete order flow

- [ ] **Step 5:** Commit: `feat: add store pages with ThePrintSpace checkout`

---

## Phase 9: Domain + SEO + Polish

### Task 9.1: Production setup

- [ ] **Step 1:** Configure custom domain www.helenvphoto.com on Vercel
- [ ] **Step 2:** Add global SEO meta tags (title, description, og:image, twitter:card)
- [ ] **Step 3:** Add favicon (crop from helen-portrait.png)
- [ ] **Step 4:** Add `robots.txt` and `sitemap.xml`
- [ ] **Step 5:** Test all pages on mobile
- [ ] **Step 6:** Commit: `feat: production SEO and domain setup`

---

## Execution Order

1. **Phase 1** — Fix maximized image (5 min)
2. **Phase 2** — Quote section (30 min)
3. **Phase 3** — 3D depth gallery (2-3 hrs)
4. **Phase 4** — Router (20 min)
5. **Phase 5** — Booking page (15 min)
6. **Phase 6** — About page (30 min)
7. **Phase 7** — Blog (1 hr)
8. **Phase 8** — Store (2-3 hrs)
9. **Phase 9** — Domain/SEO polish (30 min)

Phases 1-4 should be done sequentially (they build on each other). Phases 5-8 are independent and could be parallelized.
