import * as THREE from "three";
import WebGLContext from "./WebGLContext";
import Scene from "../scenes/Scene";
import Postprocessing from "./Postprocessing";
import WatercolorOverlay from "./WatercolorOverlay";

class Three {
	constructor(container) {
		this.container = container;
		this.context = null;
		this.scene = null;
		this.postprocessing = null;
		this.watercolorOverlay = null;
		this.clock = new THREE.Clock();
	}

	run() {
		this.context = new WebGLContext(this.container);
		this.context.init();
		this.scene = new Scene();

		const { width, height } = this.context.getFullScreenDimensions();
		this.watercolorOverlay = new WatercolorOverlay(
			this.context.renderer,
			width,
			height,
		);

		this.scene.onBrushMove = (x, y) => {
			this.watercolorOverlay.setBrushPosition(x, y);
		};

		this.#animate();
		this.#addResizeListener();
	}

	#animate() {
		const delta = this.clock.getDelta();
		const elapsed = this.clock.elapsedTime;

		this.scene.animate(delta, elapsed);
		this.#render(delta);
		requestAnimationFrame(() => this.#animate());
	}

	#render(delta) {
		this.watercolorOverlay.render(
			this.scene.scene,
			this.scene.camera,
			delta,
			(watercolorTexture) => {
				this.scene.setWatercolorTexture(watercolorTexture);
			},
		);
	}

	#addResizeListener() {
		window.addEventListener("resize", () => this.#onResize());
	}

	#onResize() {
		const { width, height } = this.context.getFullScreenDimensions();
		this.context.onResize(width, height);
		this.scene.onResize(width, height);
		this.postprocessing && this.postprocessing.resize(width, height);
		this.watercolorOverlay && this.watercolorOverlay.resize(width, height);
	}
}

export default Three;
