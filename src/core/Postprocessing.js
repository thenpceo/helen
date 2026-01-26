import {
	EffectComposer,
	EffectPass,
	RenderPass,
	NoiseEffect,
	BlendFunction,
} from "postprocessing";

class Postprocessing {
	constructor(renderer, scene, camera) {
		this.renderer = renderer;
		this.scene = scene;
		this.camera = camera;
		this.composer = null;

		this.#init();
	}

	#init() {
		this.composer = new EffectComposer(this.renderer);

		const renderPass = new RenderPass(this.scene, this.camera);
		this.composer.addPass(renderPass);

		const noiseEffect = new NoiseEffect({
			blendFunction: BlendFunction.SOFT_LIGHT,
		});

		noiseEffect.blendMode.opacity.value = 0.4;

		const effectPass = new EffectPass(this.camera, noiseEffect);
		this.composer.addPass(effectPass);
	}

	render(deltaTime) {
		this.composer.render(deltaTime);
	}

	resize(width, height) {
		this.composer.setSize(width, height);
	}
}

export default Postprocessing;
