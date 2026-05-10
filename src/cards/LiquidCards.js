import * as THREE from "three";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const damp = (current, target, lambda, dt) =>
	THREE.MathUtils.damp(current, target, lambda, dt);

const IMAGE_URLS = [
	"dsc_0300-2.jpg", "dsc_1191-2.jpg", "dsc_1247.jpg", "dsc_2393.jpg",
	"dsc_2441.jpg", "dsc_2635.jpg", "dsc_2705.jpg", "dsc_2710.jpg",
	"dsc_2959.jpg", "dsc_3005.jpg", "dsc_3043.jpg", "dsc_3408.jpg",
	"dsc_3569.jpg", "dsc_3580.jpg", "dsc_3663-2.jpg", "dsc_4395.jpg",
	"dsc_4722.jpg", "dsc_4753.jpg", "dsc_5073.jpg", "dsc_5453.jpg",
	"dsc_5587.jpg", "dsc_5676.jpg", "dsc_6415-2.jpg", "dsc_7323.jpg",
	"dsc_9279.jpg", "dsc_9290.jpg", "dsc_9311.jpg", "dsc_9338.jpg",
	"dsc_9378.jpg", "dsc_9383.jpg", "dsc_9385.jpg", "dsc_9631.jpg",
	"img_1066.jpg", "venusvoyage-7.jpg",
].map((f) => `${import.meta.env.BASE_URL}photos/${f}`);

const CARD_DATA = [
	{ name: "Taro Valley",           date: "Jun 2025" },
	{ name: "Kohala Coast",          date: "Jul 2025" },
	{ name: "Valley Rainbow",        date: "Jun 2025" },
	{ name: "The Observer",          date: "Sep 2025" },
	{ name: "Glasswing",             date: "Oct 2025" },
	{ name: "Longtail Crossing",     date: "Aug 2025" },
	{ name: "Hidden Falls",          date: "Jun 2025" },
	{ name: "Sunken Forest",         date: "Aug 2025" },
	{ name: "West Maui",             date: "Jul 2025" },
	{ name: "Island Harbor",         date: "Aug 2025" },
	{ name: "Morning Shore",         date: "Sep 2025" },
	{ name: "Golden Hour Surfers",   date: "Jul 2025" },
	{ name: "Red Rock Solitude",     date: "Nov 2025" },
	{ name: "Capitol Reef Sunset",   date: "Nov 2025" },
	{ name: "Kelingking Cove",       date: "Oct 2025" },
	{ name: "Pinnacles",             date: "Dec 2025" },
	{ name: "Forest Floor",          date: "Oct 2025" },
	{ name: "Waimea Canyon",         date: "Jul 2025" },
	{ name: "Rolling Hills",         date: "May 2025" },
	{ name: "Windswept",             date: "May 2025" },
	{ name: "Island Passage",        date: "Sep 2025" },
	{ name: "Cathedral Cove",        date: "May 2025" },
	{ name: "Rainforest Canopy",     date: "Sep 2025" },
	{ name: "Shoreline",             date: "Jul 2025" },
	{ name: "Winter Creek",          date: "Jan 2026" },
	{ name: "Garden Rose",           date: "Jun 2025" },
	{ name: "Honey Bee",             date: "Jun 2025" },
	{ name: "Sequoia Grove",         date: "Jan 2026" },
	{ name: "Giant Sequoia",         date: "Jan 2026" },
	{ name: "Red Bloom",             date: "Jun 2025" },
	{ name: "Rose Garden",           date: "Jun 2025" },
	{ name: "Distant Falls",         date: "Jun 2025" },
	{ name: "Haleakala Crater",      date: "Jul 2025" },
	{ name: "Jungle Pool",           date: "Oct 2025" },
];

export const CARD_SETTINGS = {
	cardScale: 1.25,
	imageSegments: 30,
	columnSpacing: 0.72,
	desktopGap: 38,
	mobileGap: 34,
	desktopTop: -0.18,
	mobileTop: 0.12,
	showLabels: true,
	wheelSpeed: 1.08,
	touchSpeed: 2.1,
	scrollSmoothing: 6.4,
	bendStart: 0.26,
	bendEnd: 1,
	bendDepth: 1600,
	bendYDrift: 0,
	bendRoundness: 0.86,
	waterfallWaveAmplitude: 0.049,
	waterfallWaveFrequency: 0.015,
	waterfallWaveSpeed: 0.79,
	rippleAmplitude: 8.5,
	rippleFrequency: 0.007,
	rippleSpeed: 0.79,
	noiseAmplitude: 23.9,
	noiseFrequency: 0.03,
	noiseSpeed: 1.06,
	scrollLiftStrength: 0.052,
	scrollLiftMax: 2.4,
	pointerRadius: 0.29,
	pointerElasticity: 0.099,
	pointerDepth: 63,
	pointerVelocityDepth: 0.08,
	pointerLerp: 0.18,
	pointerVelocityLerp: 0.22,
	pointerDamping: 0.82,
	pointerActiveSmoothing: 8,
	bendBrighten: 0.3,
	rippleBrighten: 0.021,
	backWashout: 0.4,
	tiltStrength: 6.5,
	tiltSmoothing: 4,
};

const vertexShader = /* glsl */ `
	uniform float uTime;
	uniform vec2 uBendPoint;
	uniform vec2 uPointer;
	uniform vec2 uPointerVelocity;
	uniform vec2 uPlaneSize;
	uniform float uPointerActive;
	uniform float uScrollVelocity;
	uniform float uPointerRadius;
	uniform float uPointerElasticity;
	uniform float uPointerDepth;
	uniform float uPointerVelocityDepth;
	uniform float uBendDepth;
	uniform float uBendYDrift;
	uniform float uBendRoundness;
	uniform float uWaterfallWaveAmplitude;
	uniform float uWaterfallWaveFrequency;
	uniform float uWaterfallWaveSpeed;
	uniform float uRippleAmplitude;
	uniform float uRippleFrequency;
	uniform float uRippleSpeed;
	uniform float uNoiseAmplitude;
	uniform float uNoiseFrequency;
	uniform float uNoiseSpeed;
	uniform float uScrollLiftStrength;
	uniform float uScrollLiftMax;

	varying vec2 vUv;
	varying float vBend;
	varying float vRipple;

	void main() {
		vUv = uv;
		vec3 pos = position;
		vec3 world = (modelMatrix * vec4(position, 1.0)).xyz;

		vec4 preClip = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
		vec2 screenUv = preClip.xy / preClip.w * 0.5 + 0.5;
		float pointerDist = distance(screenUv, uPointer);
		float pointerWave = smoothstep(uPointerRadius, 0.0, pointerDist) * uPointerActive;

		vec2 elasticPixels = uPointerVelocity * pointerWave * uPointerElasticity;
		pos.xy += elasticPixels / max(uPlaneSize, vec2(1.0));
		pos.z += pointerWave * (uPointerDepth + length(uPointerVelocity) * uPointerVelocityDepth);

		float ripple = sin((world.x - world.y) * uRippleFrequency - uTime * uRippleSpeed) * uRippleAmplitude;
		float noise = sin((world.x - world.y * 0.1) * uNoiseFrequency - uTime * uNoiseSpeed) * uNoiseAmplitude;
		float bend = smoothstep(uBendPoint.x, uBendPoint.y, world.y);
		float scrollLift = clamp(abs(uScrollVelocity) * uScrollLiftStrength, 0.0, uScrollLiftMax);
		float roundedBend = sin(pow(bend, uBendRoundness) * 1.57079632679);
		float fall = bend * bend * (3.0 - 2.0 * bend);
		float waterfallWave = sin(
			world.x * uWaterfallWaveFrequency +
			world.y * 0.006 -
			uTime * uWaterfallWaveSpeed
		) * uWaterfallWaveAmplitude * fall * (1.0 + scrollLift * 0.45);

		pos.z += ripple * (1.0 + scrollLift);
		pos.z -= uBendDepth * roundedBend;
		pos.z -= noise * fall;
		pos.z += waterfallWave * 90.0;
		pos.y -= uBendYDrift * fall;
		pos.y -= waterfallWave;
		pos.x += waterfallWave * 0.16;

		vBend = fall;
		vRipple = ripple / max(uRippleAmplitude, 0.001);

		gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
	}
`;

const fragmentShader = /* glsl */ `
	uniform sampler2D uTexture;
	uniform vec2 uImageSize;
	uniform vec2 uPlaneSize;
	uniform float uOpacity;
	uniform float uBendBrighten;
	uniform float uRippleBrighten;
	uniform float uBackWashout;
	uniform float uHoverBoost;
	uniform float uExpanded;

	varying vec2 vUv;
	varying float vBend;
	varying float vRipple;

	vec2 coverTextureUv(vec2 uv, vec2 imageSize, vec2 planeSize) {
		float planeRatio = planeSize.x / planeSize.y;
		float imageRatio = imageSize.x / imageSize.y;
		vec2 scale = vec2(1.0);
		if (planeRatio < imageRatio) {
			scale.x = planeRatio / imageRatio;
		} else {
			scale.y = imageRatio / planeRatio;
		}
		return (uv - 0.5) * scale + 0.5;
	}

	void main() {
		vec2 coverUv = coverTextureUv(vUv, uImageSize, uPlaneSize);
		vec4 color = texture2D(uTexture, coverUv);

		// When expanded, show raw image — no processing at all
		if (uExpanded > 0.5) {
			gl_FragColor = color;
			return;
		}

		float lift = vBend * uBendBrighten + abs(vRipple) * uRippleBrighten;
		color.rgb += lift;
		color.rgb = mix(color.rgb, vec3(1.0), vBend * uBackWashout);

		// Hover boost: increase saturation and contrast
		if (uHoverBoost > 0.001) {
			float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
			color.rgb = mix(vec3(lum), color.rgb, 1.0 + uHoverBoost * 0.15);
			color.rgb = (color.rgb - 0.5) * (1.0 + uHoverBoost * 0.08) + 0.5;
		}

		color.a *= uOpacity;
		gl_FragColor = color;
	}
`;

function createCardMaterial(texture, imageSize, settings, bendPoint, pointer, opacity = 1) {
	return new THREE.ShaderMaterial({
		uniforms: {
			uTexture: { value: texture },
			uImageSize: { value: imageSize.clone() },
			uPlaneSize: { value: new THREE.Vector2(1, 1) },
			uTime: { value: 0 },
			uBendPoint: { value: bendPoint.clone() },
			uPointer: { value: pointer.current.clone() },
			uPointerVelocity: { value: pointer.velocity.clone() },
			uPointerActive: { value: 0 },
			uScrollVelocity: { value: 0 },
			uPointerRadius: { value: settings.pointerRadius },
			uPointerElasticity: { value: settings.pointerElasticity },
			uPointerDepth: { value: settings.pointerDepth },
			uPointerVelocityDepth: { value: settings.pointerVelocityDepth },
			uBendDepth: { value: settings.bendDepth },
			uBendYDrift: { value: settings.bendYDrift },
			uBendRoundness: { value: settings.bendRoundness },
			uWaterfallWaveAmplitude: { value: settings.waterfallWaveAmplitude },
			uWaterfallWaveFrequency: { value: settings.waterfallWaveFrequency },
			uWaterfallWaveSpeed: { value: settings.waterfallWaveSpeed },
			uRippleAmplitude: { value: settings.rippleAmplitude },
			uRippleFrequency: { value: settings.rippleFrequency },
			uRippleSpeed: { value: settings.rippleSpeed },
			uNoiseAmplitude: { value: settings.noiseAmplitude },
			uNoiseFrequency: { value: settings.noiseFrequency },
			uNoiseSpeed: { value: settings.noiseSpeed },
			uScrollLiftStrength: { value: settings.scrollLiftStrength },
			uScrollLiftMax: { value: settings.scrollLiftMax },
			uBendBrighten: { value: settings.bendBrighten },
			uRippleBrighten: { value: settings.rippleBrighten },
			uBackWashout: { value: settings.backWashout },
			uOpacity: { value: opacity },
			uHoverBoost: { value: 0 },
			uExpanded: { value: 0 },
		},
		vertexShader,
		fragmentShader,
		transparent: true,
		depthTest: true,
		depthWrite: false,
	});
}

function createLabelTexture(name, date) {
	const canvas = document.createElement("canvas");
	canvas.width = 1400;
	canvas.height = 260;
	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.shadowColor = "rgba(0, 0, 0, 0.72)";
	ctx.shadowBlur = 24;
	ctx.shadowOffsetY = 5;
	ctx.fillStyle = "#ffffff";
	ctx.font = "700 80px Inter, Arial, sans-serif";
	ctx.letterSpacing = "6px";
	ctx.fillText(name, 0, 108);
	ctx.shadowBlur = 16;
	ctx.shadowOffsetY = 3;
	ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
	ctx.font = "400 34px Inter, Arial, sans-serif";
	ctx.letterSpacing = "4px";
	ctx.fillText(date, 4, 168);
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return { texture, size: new THREE.Vector2(canvas.width, canvas.height) };
}

class LiquidCard {
	constructor({ texture, imageSize, name, date, index, settings, bendPoint, pointer }) {
		this.group = new THREE.Group();
		this.index = index;
		this.segments = 0;
		this.isHovered = false;
		this.hoverBoost = 0;
		this.titleOpacity = 0;
		this.titleBasePosition = new THREE.Vector3();
		this.settings = settings;

		// For click-to-expand
		this.isExpanded = false;
		this.expandProgress = 0;
		this.gridPosition = new THREE.Vector3();
		this.gridScale = new THREE.Vector2(1, 1);

		this.imageMaterial = createCardMaterial(texture, imageSize, settings, bendPoint, pointer);
		this.imageMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(1, 1, 1, 1),
			this.imageMaterial,
		);
		this.imageMesh.frustumCulled = false;
		this.imageMesh.userData.card = this;
		this.group.add(this.imageMesh);

		const labelData = createLabelTexture(name, date);
		this.labelMaterial = createCardMaterial(labelData.texture, labelData.size, settings, bendPoint, pointer, 0);
		this.labelMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(1, 1, 1, 1),
			this.labelMaterial,
		);
		this.labelMesh.frustumCulled = false;
		this.labelMesh.renderOrder = 2;
		this.labelMesh.visible = false;
		this.group.add(this.labelMesh);
		this.updateSegments(settings.imageSegments);
	}

	updateSegments(value) {
		const segments = Math.round(clamp(value, 4, 96));
		if (segments === this.segments) return;
		this.segments = segments;
		const old1 = this.imageMesh.geometry;
		this.imageMesh.geometry = new THREE.PlaneGeometry(1, 1, segments, segments);
		old1.dispose();
		const tw = Math.max(8, Math.round(segments * 0.65));
		const th = Math.max(2, Math.round(segments * 0.16));
		const old2 = this.labelMesh.geometry;
		this.labelMesh.geometry = new THREE.PlaneGeometry(1, 1, tw, th);
		old2.dispose();
	}

	resize(imageWidth, imageHeight, labelHeight, viewWidth, viewHeight, settings) {
		this.imageMesh.scale.set(imageWidth, imageHeight, 1);
		this.imageMaterial.uniforms.uPlaneSize.value.set(imageWidth, imageHeight);
		const titleHeight = Math.max(labelHeight, 1);
		const titleWidth = Math.min(imageWidth * 0.82, titleHeight * 5.55);
		const inset = Math.max(18, Math.min(imageWidth, imageHeight) * 0.07);
		const imageLeftTitleX = -imageWidth * 0.5 + titleWidth * 0.5 + inset;
		const visibleLeftTitleX = -viewWidth * 0.5 - this.group.position.x + titleWidth * 0.5 + inset;
		const imageRightTitleX = imageWidth * 0.5 - titleWidth * 0.5 - inset;
		const titleX = clamp(Math.max(imageLeftTitleX, visibleLeftTitleX), imageLeftTitleX, imageRightTitleX);
		this.titleBasePosition.set(titleX, -imageHeight * 0.5 + titleHeight * 0.5 + inset, 3);
		this.updateTitleTransform(0, true);
		this.labelMesh.scale.set(titleWidth, titleHeight, 1);
		this.labelMaterial.uniforms.uPlaneSize.value.set(titleWidth, titleHeight);
	}

	updateTitleTransform(dt, force = false) {
		// Hide label when expanded
		const showLabel = this.isHovered && this.settings.showLabels && this.expandProgress < 0.3;
		const targetOpacity = showLabel ? 0.92 : 0;
		this.titleOpacity = force ? targetOpacity : damp(this.titleOpacity, targetOpacity, 12, dt);
		const progress = clamp(this.titleOpacity / 0.92, 0, 1);
		const eased = 1 - Math.pow(1 - progress, 3);
		this.labelMesh.position.copy(this.titleBasePosition);
		this.labelMesh.position.y -= (1 - eased) * 22;
		this.labelMesh.position.z = this.titleBasePosition.z + eased * 4;
		this.labelMaterial.uniforms.uOpacity.value = this.titleOpacity;
		this.labelMesh.visible = this.settings.showLabels && this.titleOpacity > 0.01;

		// Hover boost for saturation/contrast — disable when expanded
		const boostTarget = (this.isHovered && this.expandProgress < 0.3) ? 1.0 : 0.0;
		this.hoverBoost = force ? boostTarget : damp(this.hoverBoost, boostTarget, 8, dt);
		this.imageMaterial.uniforms.uHoverBoost.value = this.hoverBoost;
	}

	updateExpand(dt, camera, scrollY) {
		const targetProgress = this.isExpanded ? 1 : 0;
		this.expandProgress = damp(this.expandProgress, targetProgress, 5, dt);

		if (this.expandProgress < 0.001 && !this.isExpanded) {
			this.expandProgress = 0;
			return;
		}

		const t = this.expandProgress;
		const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

		// Target: center of viewport in world space
		const vFov = camera.fov * Math.PI / 180;
		const viewHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
		const viewWidth = viewHeight * camera.aspect;

		// Target scale: fill 85% of viewport while keeping aspect ratio
		const imgW = this.gridScale.x;
		const imgH = this.gridScale.y;
		const imgAspect = imgW / imgH;
		const viewAspect = viewWidth / viewHeight;
		let targetScale;
		if (imgAspect > viewAspect) {
			targetScale = (viewWidth * 0.85) / imgW;
		} else {
			targetScale = (viewHeight * 0.85) / imgH;
		}

		// Target position: center of screen, accounting for scroll
		const targetX = 0;
		const targetY = scrollY;
		const targetZ = 200; // come forward in Z

		// Interpolate position
		this.group.position.x = this.gridPosition.x + (targetX - this.gridPosition.x) * eased;
		this.group.position.y = this.gridPosition.y + (targetY - this.gridPosition.y) * eased;
		this.group.position.z = eased * targetZ;

		// Interpolate scale
		const s = 1 + (targetScale - 1) * eased;
		this.imageMesh.scale.set(imgW * s, imgH * s, 1);

		// Bring to front
		this.group.renderOrder = eased > 0.01 ? 100 : 0;

		// Raw image display when expanded
		this.imageMaterial.uniforms.uExpanded.value = eased;

		// Suppress ALL deformation when expanded
		const suppress = 1 - eased;
		this.imageMaterial.uniforms.uRippleAmplitude.value = this.settings.rippleAmplitude * suppress;
		this.imageMaterial.uniforms.uNoiseAmplitude.value = this.settings.noiseAmplitude * suppress;
		this.imageMaterial.uniforms.uWaterfallWaveAmplitude.value = this.settings.waterfallWaveAmplitude * suppress;
		this.imageMaterial.uniforms.uBendDepth.value = this.settings.bendDepth * suppress;
		this.imageMaterial.uniforms.uBendYDrift.value = this.settings.bendYDrift * suppress;
		this.imageMaterial.uniforms.uPointerDepth.value = this.settings.pointerDepth * suppress;
		this.imageMaterial.uniforms.uPointerElasticity.value = this.settings.pointerElasticity * suppress;
		this.imageMaterial.uniforms.uPointerActive.value = suppress;
		this.imageMaterial.uniforms.uScrollVelocity.value = 0;
		this.imageMaterial.uniforms.uScrollLiftStrength.value = this.settings.scrollLiftStrength * suppress;
		this.imageMaterial.uniforms.uBendBrighten.value = this.settings.bendBrighten * suppress;
		this.imageMaterial.uniforms.uRippleBrighten.value = this.settings.rippleBrighten * suppress;
		this.imageMaterial.uniforms.uBackWashout.value = this.settings.backWashout * suppress;
	}
}

export default class LiquidCards {
	constructor(renderer) {
		this.renderer = renderer;
		this.settings = { ...CARD_SETTINGS };
		this.cards = [];
		this.materials = new Set();
		this.width = window.innerWidth;
		this.height = window.innerHeight;

		// Cards scene — separate camera for the card layer
		this.scene = new THREE.Scene();
		this.cardsRoot = new THREE.Group();
		this.scene.add(this.cardsRoot);

		// No fog — cards fade via bend washout, not fog

		const cameraZ = 1400;
		const fov = THREE.MathUtils.radToDeg(2 * Math.atan(this.height / (2 * cameraZ)));
		this.camera = new THREE.PerspectiveCamera(fov, this.width / this.height, 10, 4000);
		this.camera.position.z = cameraZ;

		this.scroll = { target: 0, current: 0, previous: 0, velocity: 0 };
		this.maxScroll = 0;
		this.bendPoint = new THREE.Vector2();

		this.pointer = {
			current: new THREE.Vector2(0.5, 0.5),
			target: new THREE.Vector2(0.5, 0.5),
			velocity: new THREE.Vector2(),
			velocityTarget: new THREE.Vector2(),
			last: new THREE.Vector2(0.5, 0.5),
			active: 0,
			inside: false,
		};

		// Tilt state
		this.tiltCurrent = new THREE.Vector2(0, 0);
		this.tiltTarget = new THREE.Vector2(0, 0);

		this.raycaster = new THREE.Raycaster();
		this.hoverNdc = new THREE.Vector2();
		this.expandedCard = null;

		this.ready = this.#init();
	}

	async #init() {
		await this.#loadTextures();
		this.#layoutCards();
		this.#bindInput();
	}

	async #loadTextures() {
		const loader = new THREE.TextureLoader();
		const results = await Promise.allSettled(
			IMAGE_URLS.map(
				(url) =>
					new Promise((resolve, reject) => {
						loader.load(
							url,
							(tex) => {
								tex.colorSpace = THREE.SRGBColorSpace;
								tex.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 8);
								resolve({
									texture: tex,
									imageSize: new THREE.Vector2(tex.image.width, tex.image.height),
								});
							},
							undefined,
							(err) => {
								console.warn("Failed to load card image:", url, err);
								reject(err);
							},
						);
					}),
			),
		);
		const textures = results
			.filter((r) => r.status === "fulfilled")
			.map((r) => r.value);

		this.cards = textures.map((data, i) => {
			const cardData = CARD_DATA[i] || { name: `Photo ${i + 1}`, date: "2025" };
			const card = new LiquidCard({
				texture: data.texture,
				imageSize: data.imageSize,
				name: cardData.name,
				date: cardData.date,
				index: i,
				settings: this.settings,
				bendPoint: this.bendPoint,
				pointer: this.pointer,
			});
			this.materials.add(card.imageMaterial);
			this.materials.add(card.labelMaterial);
			this.cardsRoot.add(card.group);
			return card;
		});
	}

	#updateBendPoint() {
		const start = Math.min(this.settings.bendStart, this.settings.bendEnd - 0.01);
		const end = Math.max(this.settings.bendEnd, this.settings.bendStart + 0.01);
		this.bendPoint.set(this.height * start, this.height * end);
	}

	#layoutCards() {
		const s = this.settings;
		const isNarrow = this.width < 760;
		const gap = s.desktopGap;

		// Bento size templates — repeating pattern of varied card sizes
		// cols: how many grid columns this card spans
		// r: aspect ratio (height / width)
		const bentoPattern = [
			{ cols: 2, r: 0.62 },  // wide
			{ cols: 1, r: 1.2 },   // tall portrait
			{ cols: 1, r: 0.75 },  // landscape
			{ cols: 1, r: 0.9 },   // near-square
			{ cols: 2, r: 0.55 },  // wide panoramic
			{ cols: 1, r: 1.1 },   // tall
			{ cols: 1, r: 0.7 },   // landscape
			{ cols: 1, r: 0.85 },  // near-square
			{ cols: 2, r: 0.65 },  // wide
			{ cols: 1, r: 1.0 },   // square
		];

		if (isNarrow) {
			this.#layoutMobile(gap);
		} else {
			this.#layoutDesktop(gap, bentoPattern);
		}

		this.#updateBendPoint();
	}

	#layoutDesktop(gap, bentoPattern) {
		const s = this.settings;
		const numCols = 3;
		const totalGridWidth = this.width * 0.82 * s.cardScale;
		const colWidth = (totalGridWidth - gap * (numCols - 1)) / numCols;
		const gridLeft = -totalGridWidth / 2;
		const startY = this.height * 0.4;

		// Track the bottom of each column
		const colHeights = new Array(numCols).fill(0);

		let minBottom = Infinity;

		this.cards.forEach((card, index) => {
			const pattern = bentoPattern[index % bentoPattern.length];
			let spanCols = pattern.cols;

			// Find best starting column for this card
			let bestCol = 0;

			if (spanCols > 1) {
				// Multi-column card: find the position where the tallest
				// column among the spanned ones is shortest
				let bestMaxHeight = Infinity;
				for (let c = 0; c <= numCols - spanCols; c++) {
					let maxH = 0;
					for (let s = 0; s < spanCols; s++) {
						maxH = Math.max(maxH, colHeights[c + s]);
					}
					if (maxH < bestMaxHeight) {
						bestMaxHeight = maxH;
						bestCol = c;
					}
				}
			} else {
				// Single column: find the shortest column
				let minH = Infinity;
				for (let c = 0; c < numCols; c++) {
					if (colHeights[c] < minH) {
						minH = colHeights[c];
						bestCol = c;
					}
				}
			}

			// Calculate card dimensions
			const imageWidth = colWidth * spanCols + gap * (spanCols - 1);
			const imageHeight = imageWidth * pattern.r;

			// Position: top-left of the card's grid slot
			const cardX = gridLeft + bestCol * (colWidth + gap) + imageWidth / 2;

			// Y position: below the tallest column being spanned
			let topOfCard = 0;
			for (let c = bestCol; c < bestCol + spanCols; c++) {
				topOfCard = Math.max(topOfCard, colHeights[c]);
			}
			const cardY = startY - topOfCard - imageHeight / 2;

			// Update column heights
			const newBottom = topOfCard + imageHeight + gap;
			for (let c = bestCol; c < bestCol + spanCols; c++) {
				colHeights[c] = newBottom;
			}

			const labelHeight = s.showLabels ? clamp(imageWidth * 0.14, 56, 94) : 1;
			card.group.position.set(cardX, cardY, 0);
			card.gridPosition.set(cardX, cardY, 0);
			card.gridScale.set(imageWidth, imageHeight);
			card.resize(imageWidth, imageHeight, labelHeight, this.width, this.height, s);
			minBottom = Math.min(minBottom, cardY - imageHeight / 2);
		});

		this.maxScroll = Math.max(0, -minBottom + this.height * 0.54 + this.height);
		this.scroll.target = clamp(this.scroll.target, 0, this.maxScroll);
		this.scroll.current = clamp(this.scroll.current, 0, this.maxScroll);
	}

	#layoutMobile(gap) {
		const s = this.settings;
		const cardWidth = this.width * 0.88 * s.cardScale;
		const startY = this.height * 0.4;
		let cursor = 0;
		let minBottom = Infinity;

		this.cards.forEach((card, index) => {
			const r = [0.7, 0.85, 0.62, 0.9, 0.75, 0.65][index % 6];
			const imageWidth = clamp(cardWidth, 280, 560);
			const imageHeight = imageWidth * r;
			const x = 0;
			const y = startY - cursor - imageHeight / 2;
			cursor += imageHeight + gap;

			const labelHeight = s.showLabels ? clamp(imageWidth * 0.14, 46, 82) : 1;
			card.group.position.set(x, y, 0);
			card.gridPosition.set(x, y, 0);
			card.gridScale.set(imageWidth, imageHeight);
			card.resize(imageWidth, imageHeight, labelHeight, this.width, this.height, s);
			minBottom = Math.min(minBottom, y - imageHeight / 2);
		});

		this.maxScroll = Math.max(0, -minBottom + this.height * 0.54 + this.height);
		this.scroll.target = clamp(this.scroll.target, 0, this.maxScroll);
		this.scroll.current = clamp(this.scroll.current, 0, this.maxScroll);
	}

	#bindInput() {
		window.addEventListener("wheel", (e) => {
			if (e.target instanceof Element && e.target.closest(".lil-gui")) return;
			e.preventDefault();
			this.scroll.target = clamp(
				this.scroll.target + e.deltaY * this.settings.wheelSpeed,
				0, this.maxScroll,
			);
		}, { passive: false });

		let touchY = 0;
		window.addEventListener("touchstart", (e) => {
			if (!e.touches.length) return;
			touchY = e.touches[0].clientY;
		}, { passive: true });

		window.addEventListener("touchmove", (e) => {
			if (!e.touches.length) return;
			const t = e.touches[0];
			const delta = touchY - t.clientY;
			touchY = t.clientY;
			this.scroll.target = clamp(
				this.scroll.target + delta * this.settings.touchSpeed,
				0, this.maxScroll,
			);
		}, { passive: true });

		window.addEventListener("keydown", (e) => {
			const step = this.height * 0.6;
			if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
				e.preventDefault();
				this.scroll.target = clamp(this.scroll.target + step, 0, this.maxScroll);
			}
			if (e.key === "ArrowUp" || e.key === "PageUp") {
				e.preventDefault();
				this.scroll.target = clamp(this.scroll.target - step, 0, this.maxScroll);
			}
			if (e.key === "Home") {
				this.scroll.target = 0;
			}
			if (e.key === "Escape" && this.expandedCard) {
				this.expandedCard.isExpanded = false;
				this.expandedCard = null;
			}
		});

		// Click to expand/collapse
		window.addEventListener("click", (e) => {
			if (e.target instanceof Element && e.target.closest(".lil-gui")) return;
			if (e.target instanceof Element && e.target.closest(".hero")) return;
			if (e.target instanceof Element && e.target.closest(".nav-bar")) return;

			const hero = window.__heroState;
			if (hero && hero.scrollOffset < hero.exitDistance) return;

			// If a card is expanded, collapse it
			if (this.expandedCard) {
				this.expandedCard.isExpanded = false;
				this.expandedCard = null;
				return;
			}

			// Raycast to find clicked card
			const ndc = new THREE.Vector2(
				(e.clientX / this.width) * 2 - 1,
				-(e.clientY / this.height) * 2 + 1,
			);
			this.cardsRoot.updateMatrixWorld(true);
			this.raycaster.setFromCamera(ndc, this.camera);
			const hits = this.raycaster.intersectObjects(
				this.cards.map((c) => c.imageMesh),
				false,
			);
			const card = hits[0]?.object?.userData?.card;
			if (card) {
				card.isExpanded = true;
				this.expandedCard = card;
			}
		});
	}

	setPointer(clientX, clientY, inside) {
		const nx = clamp(clientX / this.width, 0, 1);
		const ny = clamp(1 - clientY / this.height, 0, 1);
		this.pointer.target.set(nx, ny);
		const dx = (nx - this.pointer.last.x) * this.width;
		const dy = (ny - this.pointer.last.y) * this.height;
		this.pointer.velocityTarget.set(dx, dy);
		this.pointer.last.set(nx, ny);
		this.pointer.inside = inside;

		// Tilt: horizontal only (Y-axis rotation)
		const tiltDeg = this.settings.tiltStrength;
		this.tiltTarget.set(
			((clientX / this.width) * 2 - 1) * tiltDeg * (Math.PI / 180),
			0,
		);
	}

	setPointerInside(inside) {
		this.pointer.inside = inside;
		if (!inside) {
			this.tiltTarget.set(0, 0);
		}
	}

	animate(dt) {
		const s = this.settings;
		const time = performance.now() / 1000;

		// Scroll
		this.scroll.previous = this.scroll.current;
		this.scroll.current = damp(this.scroll.current, this.scroll.target, s.scrollSmoothing, dt);
		this.scroll.velocity = this.scroll.current - this.scroll.previous;

		// Cards exist below the screen. The belowOffset pushes them down
		// by one screen height. As scroll increases, they naturally rise into view.
		const belowOffset = this.height;
		this.cardsRoot.position.y = this.scroll.current - belowOffset;

		// Update hero state so the hero HTML reacts to the same scroll
		if (window.__heroState) {
			window.__heroState.scrollOffset = this.scroll.current;
		}

		// Pointer
		this.pointer.current.lerp(this.pointer.target, s.pointerLerp);
		this.pointer.velocity.lerp(this.pointer.velocityTarget, s.pointerVelocityLerp);
		this.pointer.velocityTarget.multiplyScalar(s.pointerDamping);
		this.pointer.active = damp(this.pointer.active, this.pointer.inside ? 1 : 0, s.pointerActiveSmoothing, dt);

		// Tilt — apply to cardsRoot
		this.tiltCurrent.x = damp(this.tiltCurrent.x, this.tiltTarget.x, s.tiltSmoothing, dt);
		this.tiltCurrent.y = damp(this.tiltCurrent.y, this.tiltTarget.y, s.tiltSmoothing, dt);
		this.cardsRoot.rotation.y = this.tiltCurrent.x;
		this.cardsRoot.rotation.x = this.tiltCurrent.y;

		// Hover detection
		this.#updateHover(dt);

		// Expand animation
		const scrollWorldY = this.cardsRoot.position.y;
		this.cards.forEach((card) => {
			card.updateExpand(dt, this.camera, -scrollWorldY);
		});

		// Sync uniforms — skip expanded card's material (updateExpand controls it)
		const expandedMat = this.expandedCard?.imageMaterial;
		for (const mat of this.materials) {
			if (mat === expandedMat) continue;
			mat.uniforms.uTime.value = time;
			mat.uniforms.uBendPoint.value.copy(this.bendPoint);
			mat.uniforms.uPointer.value.copy(this.pointer.current);
			mat.uniforms.uPointerVelocity.value.copy(this.pointer.velocity);
			mat.uniforms.uPointerActive.value = this.pointer.active;
			mat.uniforms.uScrollVelocity.value = this.scroll.velocity;
			mat.uniforms.uPointerRadius.value = s.pointerRadius;
			mat.uniforms.uPointerElasticity.value = s.pointerElasticity;
			mat.uniforms.uPointerDepth.value = s.pointerDepth;
			mat.uniforms.uPointerVelocityDepth.value = s.pointerVelocityDepth;
			mat.uniforms.uBendDepth.value = s.bendDepth;
			mat.uniforms.uBendYDrift.value = s.bendYDrift;
			mat.uniforms.uBendRoundness.value = s.bendRoundness;
			mat.uniforms.uWaterfallWaveAmplitude.value = s.waterfallWaveAmplitude;
			mat.uniforms.uWaterfallWaveFrequency.value = s.waterfallWaveFrequency;
			mat.uniforms.uWaterfallWaveSpeed.value = s.waterfallWaveSpeed;
			mat.uniforms.uRippleAmplitude.value = s.rippleAmplitude;
			mat.uniforms.uRippleFrequency.value = s.rippleFrequency;
			mat.uniforms.uRippleSpeed.value = s.rippleSpeed;
			mat.uniforms.uNoiseAmplitude.value = s.noiseAmplitude;
			mat.uniforms.uNoiseFrequency.value = s.noiseFrequency;
			mat.uniforms.uNoiseSpeed.value = s.noiseSpeed;
			mat.uniforms.uScrollLiftStrength.value = s.scrollLiftStrength;
			mat.uniforms.uScrollLiftMax.value = s.scrollLiftMax;
			mat.uniforms.uBendBrighten.value = s.bendBrighten;
			mat.uniforms.uRippleBrighten.value = s.rippleBrighten;
			mat.uniforms.uBackWashout.value = s.backWashout;
		}

		// Expanded card: only sync time (deformation is suppressed by updateExpand)
		if (expandedMat) {
			expandedMat.uniforms.uTime.value = time;
			expandedMat.uniforms.uScrollVelocity.value = 0;
			expandedMat.uniforms.uPointerActive.value = 0;
		}
	}

	#updateHover(dt) {
		let hoveredCard = null;
		if (this.pointer.inside && this.cards.length) {
			this.hoverNdc.set(
				this.pointer.target.x * 2 - 1,
				this.pointer.target.y * 2 - 1,
			);
			this.cardsRoot.updateMatrixWorld(true);
			this.raycaster.setFromCamera(this.hoverNdc, this.camera);
			const hits = this.raycaster.intersectObjects(
				this.cards.map((c) => c.imageMesh),
				false,
			);
			hoveredCard = hits[0]?.object?.userData?.card ?? null;
		}
		this.cards.forEach((c) => {
			c.isHovered = c === hoveredCard;
			c.updateTitleTransform(dt);
		});
	}

	applySettings() {
		this.cards.forEach((c) => c.updateSegments(this.settings.imageSegments));
		this.#updateBendPoint();
		this.#layoutCards();
	}

	render() {
		const currentRT = this.renderer.getRenderTarget();
		const currentAutoClear = this.renderer.autoClear;

		this.renderer.autoClear = false;
		this.renderer.clearDepth();
		this.renderer.render(this.scene, this.camera);

		this.renderer.autoClear = currentAutoClear;
		this.renderer.setRenderTarget(currentRT);
	}

	resize(width, height) {
		this.width = width;
		this.height = height;
		const cameraZ = 1400;
		const fov = THREE.MathUtils.radToDeg(2 * Math.atan(height / (2 * cameraZ)));
		this.camera.fov = fov;
		this.camera.aspect = width / height;
		this.camera.position.z = cameraZ;
		this.camera.updateProjectionMatrix();
		this.#layoutCards();
	}
}
