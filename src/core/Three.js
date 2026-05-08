import * as THREE from "three";
import GUI from "lil-gui";
import WebGLContext from "./WebGLContext";
import Scene from "../scenes/Scene";
import Postprocessing from "./Postprocessing";
import WatercolorOverlay from "./WatercolorOverlay";
import LiquidCards from "../cards/LiquidCards";

const STORAGE_KEY = "relief-settings";

function saveSettings(obj) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

function loadSettings() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

class Three {
	constructor(container) {
		this.container = container;
		this.context = null;
		this.scene = null;
		this.postprocessing = null;
		this.watercolorOverlay = null;
		this.liquidCards = null;
		this.clock = new THREE.Clock();
		this.gui = null;
		this.renderer = null;
	}

	async run() {
		this.context = new WebGLContext(this.container);
		this.context.init();
		this.renderer = this.context.renderer;
		this.scene = new Scene();

		const { width, height } = this.context.getFullScreenDimensions();
		this.watercolorOverlay = new WatercolorOverlay(
			this.context.renderer,
			width,
			height,
		);

		this.postprocessing = new Postprocessing(
			this.context.renderer,
			width,
			height,
		);
		this.postprocessing.setInputTexture(this.watercolorOverlay.outputTarget.texture);

		this.scene.onBrushMove = (x, y) => {
			this.watercolorOverlay.setBrushPosition(x, y);
		};

		// Create liquid cards
		this.liquidCards = new LiquidCards(this.context.renderer);

		// Wire up pointer events to drive both relief AND cards
		this.#addPointerListeners();

		this.#animate();
		this.#addResizeListener();

		await this.scene.ready;
		this.#applySettings(loadSettings());
		this.#setupGUI();

		// Cards load in background — GUI already has settings reference
		this.liquidCards.ready.catch((e) => {
			console.warn("Some card textures failed to load:", e);
		});
	}

	#addPointerListeners() {
		window.addEventListener("pointermove", (e) => {
			if (e.target instanceof Element && e.target.closest(".lil-gui")) return;
			this.liquidCards.setPointer(e.clientX, e.clientY, true);
		});
		window.addEventListener("pointerenter", () => {
			this.liquidCards.setPointerInside(true);
		});
		window.addEventListener("pointerleave", () => {
			this.liquidCards.setPointerInside(false);
		});
	}

	#gatherSettings() {
		const relief = this.scene.reliefMaterial.uniforms;
		const overlay = this.watercolorOverlay.overlayMaterial.uniforms;
		const light1 = this.scene.light;
		const light2 = this.scene.light2;
		const camera = this.scene.camera;
		const brush = this.watercolorOverlay.brush;
		const mesh = this.scene.mesh;
		const pp = this.postprocessing;

		return {
			relief: {
				popRadius: relief.popRadius.value,
				popStrength: relief.popStrength.value,
				envMapIntensity: relief.envMapIntensity.value,
				grainIntensity: relief.grainIntensity.value,
				useWatercolorPop: relief.useWatercolorPop.value,
				shadowColor: "#" + relief.shadowColor.value.getHexString(),
			},
			model: {
				position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
				scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
				rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
			},
			overlay: {
				color: "#" + overlay.overlayColor.value.getHexString(),
				grainIntensity: overlay.grainIntensity.value,
			},
			brush: { scale: brush.scale.x },
			light1: {
				intensity: light1.intensity,
				position: { x: light1.position.x, y: light1.position.y, z: light1.position.z },
			},
			light2: {
				intensity: light2.intensity,
				position: { x: light2.position.x, y: light2.position.y, z: light2.position.z },
			},
			camera: {
				position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
				fov: camera.fov,
			},
			idle: { enabled: this.scene.idleEnabled, timeout: this.scene.idleTimeout },
			scene: { environmentIntensity: this.scene.scene.environmentIntensity },
			postprocessing: {
				bloom: {
					intensity: pp.bloom.intensity,
					threshold: pp.bloom.luminanceMaterial.threshold,
					smoothing: pp.bloom.luminanceMaterial.smoothing,
				},
				brightness: pp.brightnessContrast.brightness,
				contrast: pp.brightnessContrast.contrast,
				hue: pp.hueSaturation.hue,
				saturation: pp.hueSaturation.saturation,
				vignetteDarkness: pp.vignette.darkness,
				vignetteOffset: pp.vignette.offset,
				chromaticAberration: { x: pp.chromaticAberration.offset.x, y: pp.chromaticAberration.offset.y },
				toneMappingMode: pp.toneMapping.mode,
				noiseOpacity: pp.noise.blendMode.opacity.value,
			},
			cards: { ...this.liquidCards.settings },
		};
	}

	#applySettings(s) {
		if (!s) return;

		const relief = this.scene.reliefMaterial.uniforms;
		const overlay = this.watercolorOverlay.overlayMaterial.uniforms;
		const light1 = this.scene.light;
		const light2 = this.scene.light2;
		const camera = this.scene.camera;
		const brush = this.watercolorOverlay.brush;
		const mesh = this.scene.mesh;
		const pp = this.postprocessing;

		if (s.relief) {
			if (s.relief.popRadius != null) relief.popRadius.value = s.relief.popRadius;
			if (s.relief.popStrength != null) relief.popStrength.value = s.relief.popStrength;
			if (s.relief.envMapIntensity != null) relief.envMapIntensity.value = s.relief.envMapIntensity;
			if (s.relief.grainIntensity != null) relief.grainIntensity.value = s.relief.grainIntensity;
			if (s.relief.useWatercolorPop != null) relief.useWatercolorPop.value = s.relief.useWatercolorPop;
			if (s.relief.shadowColor) relief.shadowColor.value.set(s.relief.shadowColor);
		}
		if (s.model) {
			if (s.model.position) mesh.position.set(s.model.position.x, s.model.position.y, s.model.position.z);
			if (s.model.scale) mesh.scale.set(s.model.scale.x, s.model.scale.y, s.model.scale.z);
			if (s.model.rotation) mesh.rotation.set(s.model.rotation.x, s.model.rotation.y, s.model.rotation.z);
		}
		if (s.overlay) {
			if (s.overlay.color) overlay.overlayColor.value.set(s.overlay.color);
			if (s.overlay.grainIntensity != null) overlay.grainIntensity.value = s.overlay.grainIntensity;
		}
		if (s.brush && s.brush.scale != null) {
			brush.scale.setScalar(s.brush.scale);
		}
		if (s.light1) {
			if (s.light1.intensity != null) light1.intensity = s.light1.intensity;
			if (s.light1.position) light1.position.set(s.light1.position.x, s.light1.position.y, s.light1.position.z);
		}
		if (s.light2) {
			if (s.light2.intensity != null) light2.intensity = s.light2.intensity;
			if (s.light2.position) light2.position.set(s.light2.position.x, s.light2.position.y, s.light2.position.z);
		}
		if (s.camera) {
			if (s.camera.position) camera.position.set(s.camera.position.x, s.camera.position.y, s.camera.position.z);
			if (s.camera.fov != null) { camera.fov = s.camera.fov; camera.updateProjectionMatrix(); }
		}
		if (s.idle) {
			if (s.idle.enabled != null) this.scene.idleEnabled = s.idle.enabled;
			if (s.idle.timeout != null) this.scene.idleTimeout = s.idle.timeout;
		}
		if (s.scene && s.scene.environmentIntensity != null) {
			this.scene.scene.environmentIntensity = s.scene.environmentIntensity;
		}
		if (s.postprocessing) {
			const p = s.postprocessing;
			if (p.bloom) {
				if (p.bloom.intensity != null) pp.bloom.intensity = p.bloom.intensity;
				if (p.bloom.threshold != null) pp.bloom.luminanceMaterial.threshold = p.bloom.threshold;
				if (p.bloom.smoothing != null) pp.bloom.luminanceMaterial.smoothing = p.bloom.smoothing;
			}
			if (p.brightness != null) pp.brightnessContrast.brightness = p.brightness;
			if (p.contrast != null) pp.brightnessContrast.contrast = p.contrast;
			if (p.hue != null) pp.hueSaturation.hue = p.hue;
			if (p.saturation != null) pp.hueSaturation.saturation = p.saturation;
			if (p.vignetteDarkness != null) pp.vignette.darkness = p.vignetteDarkness;
			if (p.vignetteOffset != null) pp.vignette.offset = p.vignetteOffset;
			if (p.chromaticAberration) {
				pp.chromaticAberration.offset.x = p.chromaticAberration.x;
				pp.chromaticAberration.offset.y = p.chromaticAberration.y;
			}
			if (p.toneMappingMode != null) pp.toneMapping.mode = p.toneMappingMode;
			if (p.noiseOpacity != null) pp.noise.blendMode.opacity.value = p.noiseOpacity;
		}
	}

	#persist() {
		saveSettings(this.#gatherSettings());
	}

	#setupGUI() {
		this.gui = new GUI({ title: "Controls" });
		const persist = () => this.#persist();

		const relief = this.scene.reliefMaterial.uniforms;
		const overlay = this.watercolorOverlay.overlayMaterial.uniforms;
		const light1 = this.scene.light;
		const light2 = this.scene.light2;
		const camera = this.scene.camera;
		const brush = this.watercolorOverlay.brush;
		const mesh = this.scene.mesh;
		const pp = this.postprocessing;
		const cs = this.liquidCards.settings;

		// ========== RELIEF BACKGROUND ==========
		const bgFolder = this.gui.addFolder("Background (Relief)");

		const reliefFolder = bgFolder.addFolder("Relief");
		reliefFolder.add(relief.popRadius, "value", 0.1, 5.0, 0.01).name("Pop Radius").onChange(persist);
		reliefFolder.add(relief.popStrength, "value", 0.0, 3.0, 0.01).name("Pop Strength").onChange(persist);
		reliefFolder.add(relief.envMapIntensity, "value", 0.0, 3.0, 0.01).name("Env Map Intensity").onChange(persist);
		reliefFolder.add(relief.grainIntensity, "value", 0.0, 0.3, 0.001).name("Grain").onChange(persist);
		reliefFolder.add(relief.useWatercolorPop, "value").name("Watercolor Pop").onChange(persist);
		const shadowColorProxy = { color: "#" + relief.shadowColor.value.getHexString() };
		reliefFolder.addColor(shadowColorProxy, "color").name("Shadow Color").onChange((v) => {
			relief.shadowColor.value.set(v);
			persist();
		});

		const modelFolder = bgFolder.addFolder("Model");
		modelFolder.add(mesh.position, "x", -5, 5, 0.01).name("Position X").onChange(persist);
		modelFolder.add(mesh.position, "y", -5, 5, 0.01).name("Position Y").onChange(persist);
		modelFolder.add(mesh.position, "z", -5, 5, 0.01).name("Position Z").onChange(persist);
		const scaleProxy = { uniform: mesh.scale.x };
		modelFolder.add(scaleProxy, "uniform", 0.01, 10, 0.01).name("Scale").onChange((v) => {
			mesh.scale.setScalar(v);
			persist();
		});

		const overlayFolder = bgFolder.addFolder("Overlay");
		const overlayColorProxy = { color: "#" + overlay.overlayColor.value.getHexString() };
		overlayFolder.addColor(overlayColorProxy, "color").name("Color").onChange((v) => {
			overlay.overlayColor.value.set(v);
			persist();
		});
		overlayFolder.add(overlay.grainIntensity, "value", 0.0, 0.3, 0.001).name("Grain").onChange(persist);

		const brushFolder = bgFolder.addFolder("Brush");
		const brushProxy = { scale: brush.scale.x || 1.2 };
		brushFolder.add(brushProxy, "scale", 0.1, 5.0, 0.01).name("Scale").onChange((v) => {
			brush.scale.setScalar(v);
			persist();
		});

		const lightFolder = bgFolder.addFolder("Light 1");
		lightFolder.add(light1, "intensity", 0.0, 5.0, 0.01).name("Intensity").onChange(persist);
		lightFolder.add(light1.position, "x", -5, 5, 0.1).name("X").onChange(persist);
		lightFolder.add(light1.position, "y", -5, 5, 0.1).name("Y").onChange(persist);
		lightFolder.add(light1.position, "z", -5, 5, 0.1).name("Z").onChange(persist);

		const light2Folder = bgFolder.addFolder("Light 2");
		light2Folder.add(light2, "intensity", 0.0, 5.0, 0.01).name("Intensity").onChange(persist);
		light2Folder.add(light2.position, "x", -5, 5, 0.1).name("X").onChange(persist);
		light2Folder.add(light2.position, "y", -5, 5, 0.1).name("Y").onChange(persist);
		light2Folder.add(light2.position, "z", -5, 5, 0.1).name("Z").onChange(persist);

		const cameraFolder = bgFolder.addFolder("Camera");
		cameraFolder.add(camera.position, "x", -5, 5, 0.01).name("X").onChange(persist);
		cameraFolder.add(camera.position, "y", -5, 5, 0.01).name("Y").onChange(persist);
		cameraFolder.add(camera.position, "z", 0.5, 10, 0.01).name("Z").onChange(persist);
		cameraFolder.add(camera, "fov", 10, 120, 1).name("FOV").onChange(() => {
			camera.updateProjectionMatrix();
			persist();
		});

		const idleFolder = bgFolder.addFolder("Idle Animation");
		idleFolder.add(this.scene, "idleEnabled").name("Enabled").onChange(persist);
		idleFolder.add(this.scene, "idleTimeout", 0.1, 5.0, 0.1).name("Idle Delay (s)").onChange(persist);

		const sceneFolder = bgFolder.addFolder("Scene");
		sceneFolder.add(this.scene.scene, "environmentIntensity", 0.0, 2.0, 0.01).name("Env Intensity").onChange(persist);

		const ppFolder = bgFolder.addFolder("Postprocessing");
		const bloomFolder = ppFolder.addFolder("Bloom");
		bloomFolder.add(pp.bloom, "intensity", 0.0, 10.0, 0.01).name("Intensity").onChange(persist);
		bloomFolder.add(pp.bloom.luminanceMaterial, "threshold", 0.0, 1.0, 0.01).name("Threshold").onChange(persist);
		bloomFolder.add(pp.bloom.luminanceMaterial, "smoothing", 0.0, 1.0, 0.01).name("Smoothing").onChange(persist);
		const bcFolder = ppFolder.addFolder("Brightness / Contrast");
		bcFolder.add(pp.brightnessContrast, "brightness", -1.0, 1.0, 0.01).name("Brightness").onChange(persist);
		bcFolder.add(pp.brightnessContrast, "contrast", -1.0, 1.0, 0.01).name("Contrast").onChange(persist);
		const hsFolder = ppFolder.addFolder("Hue / Saturation");
		hsFolder.add(pp.hueSaturation, "hue", -Math.PI, Math.PI, 0.01).name("Hue").onChange(persist);
		hsFolder.add(pp.hueSaturation, "saturation", -1.0, 1.0, 0.01).name("Saturation").onChange(persist);
		const vignetteFolder = ppFolder.addFolder("Vignette");
		vignetteFolder.add(pp.vignette, "darkness", 0.0, 2.0, 0.01).name("Darkness").onChange(persist);
		vignetteFolder.add(pp.vignette, "offset", 0.0, 1.0, 0.01).name("Offset").onChange(persist);
		const caFolder = ppFolder.addFolder("Chromatic Aberration");
		const caProxy = { x: pp.chromaticAberration.offset.x, y: pp.chromaticAberration.offset.y };
		caFolder.add(caProxy, "x", 0.0, 0.01, 0.0001).name("Offset X").onChange((v) => {
			pp.chromaticAberration.offset.x = v;
			persist();
		});
		caFolder.add(caProxy, "y", 0.0, 0.01, 0.0001).name("Offset Y").onChange((v) => {
			pp.chromaticAberration.offset.y = v;
			persist();
		});
		const tmFolder = ppFolder.addFolder("Tone Mapping");
		const tmModes = {
			"None": THREE.LinearToneMapping,
			"Reinhard": THREE.ReinhardToneMapping,
			"Cineon": THREE.CineonToneMapping,
			"ACES Filmic": THREE.ACESFilmicToneMapping,
			"AGX": THREE.AgXToneMapping,
			"Neutral": THREE.NeutralToneMapping,
		};
		const tmReverse = Object.fromEntries(Object.entries(tmModes).map(([k, v]) => [v, k]));
		const tmProxy = { mode: tmReverse[pp.toneMapping.mode] || "AGX" };
		tmFolder.add(tmProxy, "mode", Object.keys(tmModes)).name("Mode").onChange((v) => {
			pp.toneMapping.mode = tmModes[v];
			persist();
		});
		const noiseFolder = ppFolder.addFolder("Film Noise");
		noiseFolder.add(pp.noise.blendMode.opacity, "value", 0.0, 1.0, 0.01).name("Opacity").onChange(persist);

		bgFolder.close();

		// ========== CARDS ==========
		const cardsFolder = this.gui.addFolder("Cards");
		const applyCards = () => this.liquidCards.applySettings();

		const cardLayoutFolder = cardsFolder.addFolder("Layout");
		cardLayoutFolder.add(cs, "cardScale", 0.65, 1.6, 0.01).name("Card Scale").onChange(applyCards);
		cardLayoutFolder.add(cs, "imageSegments", 4, 96, 1).name("Mesh Segments").onChange(applyCards);
		cardLayoutFolder.add(cs, "columnSpacing", 0.45, 1.2, 0.01).name("Column Spacing").onChange(applyCards);
		cardLayoutFolder.add(cs, "desktopGap", 0, 180, 1).name("Desktop Gutter").onChange(applyCards);
		cardLayoutFolder.add(cs, "desktopTop", -0.18, 0.28, 0.01).name("Desktop Top").onChange(applyCards);
		cardLayoutFolder.add(cs, "showLabels").name("Show Labels").onChange(applyCards);

		const cardScrollFolder = cardsFolder.addFolder("Scroll");
		cardScrollFolder.add(cs, "wheelSpeed", 0.25, 3, 0.01).name("Wheel Speed");
		cardScrollFolder.add(cs, "touchSpeed", 0.5, 4, 0.01).name("Touch Speed");
		cardScrollFolder.add(cs, "scrollSmoothing", 1, 18, 0.1).name("Smoothing");

		const cardBendFolder = cardsFolder.addFolder("Backward Bend");
		cardBendFolder.add(cs, "bendStart", 0, 0.75, 0.01).name("Start").onChange(applyCards);
		cardBendFolder.add(cs, "bendEnd", 0.08, 1, 0.01).name("End").onChange(applyCards);
		cardBendFolder.add(cs, "bendDepth", 0, 1600, 1).name("Depth");
		cardBendFolder.add(cs, "bendYDrift", 0, 0.9, 0.01).name("Down Fall");
		cardBendFolder.add(cs, "bendRoundness", 0.28, 2, 0.01).name("Lip Roundness");
		cardBendFolder.add(cs, "waterfallWaveAmplitude", 0, 0.34, 0.001).name("Fall Wave");
		cardBendFolder.add(cs, "waterfallWaveFrequency", 0.002, 0.07, 0.001).name("Wave Freq");
		cardBendFolder.add(cs, "waterfallWaveSpeed", 0, 5, 0.01).name("Wave Speed");

		const cardClothFolder = cardsFolder.addFolder("Cloth Wave");
		cardClothFolder.add(cs, "rippleAmplitude", 0, 40, 0.1).name("Ripple Amp");
		cardClothFolder.add(cs, "rippleFrequency", 0.002, 0.08, 0.001).name("Ripple Freq");
		cardClothFolder.add(cs, "rippleSpeed", 0, 6, 0.01).name("Ripple Speed");
		cardClothFolder.add(cs, "noiseAmplitude", 0, 120, 0.1).name("Noise Amp");
		cardClothFolder.add(cs, "noiseFrequency", 0.002, 0.08, 0.001).name("Noise Freq");
		cardClothFolder.add(cs, "noiseSpeed", 0, 5, 0.01).name("Noise Speed");

		const cardPointerFolder = cardsFolder.addFolder("Pointer Liquid");
		cardPointerFolder.add(cs, "pointerRadius", 0.05, 0.8, 0.01).name("Radius");
		cardPointerFolder.add(cs, "pointerElasticity", 0, 0.5, 0.001).name("Elasticity");
		cardPointerFolder.add(cs, "pointerDepth", 0, 120, 0.1).name("Depth Push");

		const cardTiltFolder = cardsFolder.addFolder("Mouse Tilt");
		cardTiltFolder.add(cs, "tiltStrength", 0, 45, 0.5).name("Tilt Degrees");
		cardTiltFolder.add(cs, "tiltSmoothing", 1, 18, 0.1).name("Smoothing");

		const cardColorFolder = cardsFolder.addFolder("Image Response");
		cardColorFolder.add(cs, "bendBrighten", 0, 0.3, 0.001).name("Bend Brighten");
		cardColorFolder.add(cs, "rippleBrighten", 0, 0.2, 0.001).name("Ripple Brighten");
		cardColorFolder.add(cs, "backWashout", 0, 0.4, 0.001).name("Back Washout");

		// --- Export / Reset ---
		this.gui.add({ copySettings: () => {
			const json = JSON.stringify(this.#gatherSettings(), null, 2);
			navigator.clipboard.writeText(json);
			console.log("Settings copied to clipboard:\n", json);
			alert("Settings copied to clipboard!");
		}}, "copySettings").name("📋 Copy Current Settings");

		this.gui.add({ resetSettings: () => {
			localStorage.removeItem(STORAGE_KEY);
			location.reload();
		}}, "resetSettings").name("🔄 Reset to Code Defaults");
	}

	#animate() {
		const delta = this.clock.getDelta();
		const elapsed = this.clock.elapsedTime;

		this.scene.animate(delta, elapsed);
		this.liquidCards && this.liquidCards.animate(Math.min(delta, 0.05));
		this.#render(delta);
		requestAnimationFrame(() => this.#animate());
	}

	#render(delta) {
		const expandedCard = this.liquidCards?.expandedCard;
		const expandedVisible = expandedCard && expandedCard.expandProgress > 0.01;

		// Hide expanded card from the postprocessed pass
		if (expandedVisible) {
			expandedCard.imageMesh.visible = false;
			expandedCard.labelMesh.visible = false;
		}

		// 1. Render relief background to output target
		this.watercolorOverlay.render(
			this.scene.scene,
			this.scene.camera,
			delta,
			(watercolorTexture) => {
				this.scene.setWatercolorTexture(watercolorTexture);
			},
		);

		// 2. Render cards (minus expanded) into the same output target
		if (this.liquidCards) {
			this.renderer.setRenderTarget(this.watercolorOverlay.outputTarget);
			this.renderer.autoClear = false;
			this.renderer.clearDepth();
			this.renderer.render(this.liquidCards.scene, this.liquidCards.camera);
			this.renderer.autoClear = true;
			this.renderer.setRenderTarget(null);
		}

		// 3. Postprocess everything (relief + cards) to screen
		this.postprocessing.render(delta);

		// 4. Render expanded card directly to screen — clean, no postprocessing
		if (expandedVisible) {
			expandedCard.imageMesh.visible = true;
			// Temporarily remove from cards scene, add to a clean scene
			const parent = expandedCard.group.parent;
			parent.remove(expandedCard.group);

			if (!this._expandScene) {
				this._expandScene = new THREE.Scene();
			}
			this._expandScene.add(expandedCard.group);

			this.renderer.autoClear = false;
			this.renderer.clearDepth();
			this.renderer.render(this._expandScene, this.liquidCards.camera);
			this.renderer.autoClear = true;

			// Move back to cards scene
			this._expandScene.remove(expandedCard.group);
			parent.add(expandedCard.group);
		}
	}

	#addResizeListener() {
		window.addEventListener("resize", () => this.#onResize());
	}

	#onResize() {
		const { width, height } = this.context.getFullScreenDimensions();
		this.context.onResize(width, height);
		this.scene.onResize(width, height);
		this.watercolorOverlay && this.watercolorOverlay.resize(width, height);
		this.postprocessing && this.postprocessing.resize(width, height);
		this.liquidCards && this.liquidCards.resize(width, height);
	}
}

export default Three;
