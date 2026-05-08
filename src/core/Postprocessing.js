import * as THREE from "three";
import {
	EffectComposer,
	EffectPass,
	RenderPass,
	BloomEffect,
	BrightnessContrastEffect,
	HueSaturationEffect,
	VignetteEffect,
	ChromaticAberrationEffect,
	ToneMappingEffect,
	NoiseEffect,
	BlendFunction,
} from "postprocessing";

class Postprocessing {
	constructor(renderer, width, height) {
		this.renderer = renderer;

		// Fullscreen quad scene to display the watercolor output texture
		this.quadScene = new THREE.Scene();
		this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		this.quadMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
		this.quadMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(2, 2),
			this.quadMaterial,
		);
		this.quadScene.add(this.quadMesh);

		// Effects
		this.bloom = new BloomEffect({
			intensity: 0.83,
			luminanceThreshold: 0.65,
			luminanceSmoothing: 0.26,
			mipmapBlur: true,
		});

		this.brightnessContrast = new BrightnessContrastEffect({
			brightness: 0,
			contrast: 0,
		});

		this.hueSaturation = new HueSaturationEffect({
			hue: 0.0015926535897502815,
			saturation: 0,
		});

		this.vignette = new VignetteEffect({
			darkness: 0.0,
			offset: 0.5,
		});

		this.chromaticAberration = new ChromaticAberrationEffect({
			offset: new THREE.Vector2(0.0008, 0.0008),
			radialModulation: false,
			modulationOffset: 0.15,
		});

		this.toneMapping = new ToneMappingEffect({
			mode: THREE.AgXToneMapping,
		});

		this.noise = new NoiseEffect({
			blendFunction: BlendFunction.SOFT_LIGHT,
		});
		this.noise.blendMode.opacity.value = 0.2;

		// Composer
		this.composer = new EffectComposer(this.renderer);

		const renderPass = new RenderPass(this.quadScene, this.quadCamera);
		this.composer.addPass(renderPass);

		const effectPass = new EffectPass(
			this.quadCamera,
			this.bloom,
			this.brightnessContrast,
			this.hueSaturation,
			this.vignette,
			this.chromaticAberration,
			this.toneMapping,
			this.noise,
		);
		this.composer.addPass(effectPass);

		this.composer.setSize(width, height);
	}

	setInputTexture(texture) {
		this.quadMaterial.map = texture;
		this.quadMaterial.needsUpdate = true;
	}

	render(deltaTime) {
		this.composer.render(deltaTime);
	}

	resize(width, height) {
		this.composer.setSize(width, height);
	}
}

export default Postprocessing;
