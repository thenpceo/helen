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

const CARD_LABELS = IMAGE_URLS.map((_, i) => `PHOTO ${String(i + 1).padStart(2, "0")}`);

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
		float lift = vBend * uBendBrighten + abs(vRipple) * uRippleBrighten;
		color.rgb += lift;
		color.rgb = mix(color.rgb, vec3(1.0), vBend * uBackWashout);
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
		},
		vertexShader,
		fragmentShader,
		transparent: true,
		depthTest: true,
		depthWrite: false,
	});
}

function createLabelTexture(label, index) {
	const canvas = document.createElement("canvas");
	canvas.width = 1400;
	canvas.height = 260;
	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.shadowColor = "rgba(0, 0, 0, 0.72)";
	ctx.shadowBlur = 24;
	ctx.shadowOffsetY = 5;
	ctx.fillStyle = "#ffffff";
	ctx.font = "700 88px Inter, Arial, sans-serif";
	ctx.letterSpacing = "10px";
	ctx.fillText(label, 0, 112);
	ctx.shadowBlur = 16;
	ctx.shadowOffsetY = 3;
	ctx.fillStyle = "rgba(255, 255, 255, 0.76)";
	ctx.font = "600 32px Inter, Arial, sans-serif";
	ctx.letterSpacing = "5px";
	ctx.fillText(`FIELD ${String(index + 1).padStart(2, "0")}`, 4, 168);
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return { texture, size: new THREE.Vector2(canvas.width, canvas.height) };
}

class LiquidCard {
	constructor({ texture, imageSize, label, index, settings, bendPoint, pointer }) {
		this.group = new THREE.Group();
		this.index = index;
		this.segments = 0;
		this.isHovered = false;
		this.titleOpacity = 0;
		this.titleBasePosition = new THREE.Vector3();
		this.settings = settings;

		this.imageMaterial = createCardMaterial(texture, imageSize, settings, bendPoint, pointer);
		this.imageMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(1, 1, 1, 1),
			this.imageMaterial,
		);
		this.imageMesh.frustumCulled = false;
		this.imageMesh.userData.card = this;
		this.group.add(this.imageMesh);

		const labelData = createLabelTexture(label, index);
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
		const targetOpacity = this.isHovered && this.settings.showLabels ? 0.92 : 0;
		this.titleOpacity = force ? targetOpacity : damp(this.titleOpacity, targetOpacity, 12, dt);
		const progress = clamp(this.titleOpacity / 0.92, 0, 1);
		const eased = 1 - Math.pow(1 - progress, 3);
		this.labelMesh.position.copy(this.titleBasePosition);
		this.labelMesh.position.y -= (1 - eased) * 22;
		this.labelMesh.position.z = this.titleBasePosition.z + eased * 4;
		this.labelMaterial.uniforms.uOpacity.value = this.titleOpacity;
		this.labelMesh.visible = this.settings.showLabels && this.titleOpacity > 0.01;
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
			const card = new LiquidCard({
				texture: data.texture,
				imageSize: data.imageSize,
				label: CARD_LABELS[i],
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
		const desktopBento = [
			{ x: -0.36, y: 0.30, w: 0.58, r: 0.58 },
			{ x: 0.43, y: 0.18, w: 0.50, r: 0.70 },
			{ x: -0.28, y: -0.34, w: 0.56, r: 0.64 },
			{ x: 0.46, y: -0.45, w: 0.60, r: 0.55 },
			{ x: -0.46, y: -0.96, w: 0.48, r: 0.88 },
			{ x: 0.30, y: -1.02, w: 0.66, r: 0.58 },
		];
		const mobileBento = [
			{ x: -0.12, w: 1.12, r: 0.64 },
			{ x: 0.12, w: 1.04, r: 0.78 },
			{ x: -0.08, w: 1.16, r: 0.62 },
			{ x: 0.15, w: 1.08, r: 0.72 },
			{ x: -0.16, w: 1.02, r: 0.92 },
			{ x: 0.08, w: 1.18, r: 0.60 },
		];

		let minBottom = Infinity;
		this.cards.forEach((card, index) => {
			let x, y, imageWidth, imageHeight;
			if (isNarrow) {
				const item = mobileBento[index % mobileBento.length];
				imageWidth = clamp(this.width * item.w * s.cardScale, 300, 620);
				imageHeight = imageWidth * item.r;
				const prev = this.cards.slice(0, index).reduce((sum, _, pi) => {
					const p = mobileBento[pi % mobileBento.length];
					const pw = clamp(this.width * p.w * s.cardScale, 300, 620);
					return sum + pw * p.r + s.mobileGap;
				}, 0);
				x = this.width * item.x;
				y = this.height * (0.5 - s.mobileTop) - imageHeight * 0.5 - prev;
			} else {
				const item = desktopBento[index % desktopBento.length];
				imageWidth = clamp(this.width * item.w * s.cardScale, 360, 920);
				imageHeight = imageWidth * item.r;
				x = this.width * item.x * s.columnSpacing / 0.72;
				y = this.height * (item.y + s.desktopTop) - Math.floor(index / desktopBento.length) * (this.height * 1.58 + s.desktopGap);
			}
			const labelHeight = s.showLabels ? clamp(imageWidth * 0.14, isNarrow ? 46 : 56, isNarrow ? 82 : 94) : 1;
			card.group.position.set(x, y, 0);
			card.resize(imageWidth, imageHeight, labelHeight, this.width, this.height, s);
			minBottom = Math.min(minBottom, y - imageHeight * 0.5);
		});

		// Extra height at the start for hero section (cards start below screen)
		this.maxScroll = Math.max(0, -minBottom + this.height * 0.54 + this.height);
		this.scroll.target = clamp(this.scroll.target, 0, this.maxScroll);
		this.scroll.current = clamp(this.scroll.current, 0, this.maxScroll);
		this.#updateBendPoint();
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

		// Sync uniforms
		for (const mat of this.materials) {
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
