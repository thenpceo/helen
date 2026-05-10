import * as THREE from "three";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Category data — images assigned to categories
// Using existing photos, will be replaced with dedicated category images later
const CATEGORIES = [
	{
		name: "Beachside",
		images: ["dsc_3043.jpg", "dsc_2959.jpg", "dsc_7323.jpg", "dsc_3663-2.jpg"],
	},
	{
		name: "Waterfall",
		images: ["dsc_2705.jpg", "dsc_9631.jpg"],
	},
	{
		name: "Scenic View",
		images: ["dsc_3005.jpg", "dsc_4753.jpg", "dsc_1191-2.jpg", "dsc_1247.jpg"],
	},
	{
		name: "Wildlife",
		images: ["dsc_2393.jpg", "dsc_2441.jpg"],
	},
	{
		name: "Retreats",
		images: ["dsc_2635.jpg", "dsc_5587.jpg", "dsc_5676.jpg"],
	},
	{
		name: "Nature",
		images: ["dsc_4722.jpg", "dsc_9290.jpg", "dsc_9311.jpg", "dsc_9383.jpg", "dsc_0300-2.jpg"],
	},
	{
		name: "Portraits",
		images: ["dsc_3569.jpg", "dsc_3580.jpg"],
	},
];

// Flatten into ordered plane data
function buildPlaneData() {
	const planes = [];
	// Interleave categories so you cycle through them
	const maxLen = Math.max(...CATEGORIES.map((c) => c.images.length));
	for (let i = 0; i < maxLen; i++) {
		for (const cat of CATEGORIES) {
			if (i < cat.images.length) {
				planes.push({
					image: cat.images[i],
					category: cat.name,
					// Slight offset positions for variety
					x: (Math.random() - 0.5) * 1.2,
					y: (Math.random() - 0.5) * 0.4,
				});
			}
		}
	}
	return planes;
}

export default class DepthGallery {
	constructor(renderer) {
		this.renderer = renderer;
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			45,
			window.innerWidth / window.innerHeight,
			0.1,
			200,
		);

		this.planes = [];
		this.planeData = buildPlaneData();
		this.planeGap = 5;
		this.active = false;

		// Scroll state (driven externally)
		this.scrollProgress = 0; // 0 = start, 1 = end
		this.currentCategory = "";

		// Category label element
		this.labelEl = document.getElementById("depth-category-label");
		this.labelTextEl = this.labelEl?.querySelector(".depth-category-text");

		// Parallax
		this.pointerX = 0;
		this.pointerY = 0;
		this.pointerTargetX = 0;
		this.pointerTargetY = 0;

		this.ready = this.#init();
	}

	async #init() {
		await this.#loadTextures();
		this.#createPlanes();
		this.#positionCamera();

		window.addEventListener("pointermove", (e) => {
			this.pointerTargetX = (e.clientX / window.innerWidth) * 2 - 1;
			this.pointerTargetY = -(e.clientY / window.innerHeight) * 2 + 1;
		});
	}

	async #loadTextures() {
		const loader = new THREE.TextureLoader();
		const unique = [...new Set(this.planeData.map((p) => p.image))];

		this.textures = new Map();
		const results = await Promise.allSettled(
			unique.map(
				(img) =>
					new Promise((resolve, reject) => {
						const url = `${import.meta.env.BASE_URL}photos/${img}`;
						loader.load(
							url,
							(tex) => {
								tex.colorSpace = THREE.SRGBColorSpace;
								tex.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 8);
								this.textures.set(img, tex);
								resolve();
							},
							undefined,
							reject,
						);
					}),
			),
		);
	}

	#createPlanes() {
		const geo = new THREE.PlaneGeometry(3, 3);

		this.planeData.forEach((data, index) => {
			const tex = this.textures.get(data.image);
			const aspect = tex?.image
				? tex.image.width / tex.image.height
				: 1;

			const mat = new THREE.MeshBasicMaterial({
				map: tex || null,
				color: tex ? 0xffffff : 0x333333,
				side: THREE.DoubleSide,
				transparent: true,
				depthWrite: false,
				opacity: index === 0 ? 1 : 0,
			});

			const mesh = new THREE.Mesh(geo, mat);
			mesh.scale.set(aspect, 1, 1);
			mesh.position.set(data.x, data.y, -index * this.planeGap);
			mesh.userData = { category: data.category, baseX: data.x, baseY: data.y };

			this.scene.add(mesh);
			this.planes.push(mesh);
		});
	}

	#positionCamera() {
		if (!this.planes.length) return;
		const firstZ = this.planes[0].position.z;
		this.cameraStartZ = firstZ + 5;
		const lastZ = this.planes[this.planes.length - 1].position.z;
		this.cameraEndZ = lastZ + 3;
		this.camera.position.z = this.cameraStartZ;
	}

	setActive(active) {
		this.active = active;
		if (this.labelEl) {
			this.labelEl.style.display = active ? "" : "none";
		}
	}

	/**
	 * @param {number} progress — 0 to 1, how far through the depth gallery
	 */
	update(progress) {
		if (!this.planes.length) return;

		this.scrollProgress = clamp(progress, 0, 1);

		// Map progress to camera Z
		const cameraZ = this.cameraStartZ - this.scrollProgress * (this.cameraStartZ - this.cameraEndZ);
		this.camera.position.z = cameraZ;

		// Smooth pointer
		this.pointerX += (this.pointerTargetX - this.pointerX) * 0.06;
		this.pointerY += (this.pointerTargetY - this.pointerY) * 0.06;

		// Update plane visibility + parallax
		let closestIndex = 0;
		let closestDist = Infinity;

		this.planes.forEach((plane, index) => {
			const planeZ = plane.position.z;
			const dist = Math.abs(cameraZ - planeZ);

			// Fade: visible when camera is within 1 planeGap
			const normalizedDist = dist / this.planeGap;
			const targetOpacity = Math.max(0, 1 - normalizedDist);
			plane.material.opacity += (targetOpacity - plane.material.opacity) * 0.12;

			// Parallax — stronger for visible planes
			const parallaxStrength = plane.material.opacity;
			const depthFactor = 1 + index * 0.03;
			plane.position.x = plane.userData.baseX + this.pointerX * 0.15 * parallaxStrength * depthFactor;
			plane.position.y = plane.userData.baseY + this.pointerY * 0.08 * parallaxStrength * depthFactor;

			// Track closest
			if (dist < closestDist) {
				closestDist = dist;
				closestIndex = index;
			}
		});

		// Update category label
		const newCategory = this.planes[closestIndex]?.userData.category || "";
		if (newCategory !== this.currentCategory) {
			this.currentCategory = newCategory;
			if (this.labelTextEl) {
				this.labelTextEl.textContent = newCategory;
			}
		}

		// Label opacity based on whether gallery is active
		if (this.labelEl) {
			const labelOpacity = this.active ? 1 : 0;
			this.labelEl.style.opacity = labelOpacity;
		}
	}

	resize(width, height) {
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
	}
}
