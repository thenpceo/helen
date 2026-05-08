import * as THREE from "three";
import watercolorVertexShader from "../shaders/watercolor.vert.glsl";
import watercolorFBOShader from "../shaders/watercolor.fbo.glsl";
import overlayFragmentShader from "../shaders/overlay.frag.glsl";

class WatercolorOverlay {
	constructor(renderer, width, height) {
		this.renderer = renderer;
		this.width = width;
		this.height = height;
		this.time = 0;

		this.#init();
	}

	#init() {
		this.#createRenderTargets();
		this.#createWhiteBackground();
		this.#createBrushScene();
		this.#createFBOScene();
		this.#createOverlayScene();
		this.#initializeWhiteTarget();

		this.outputTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
		});
	}

	#createRenderTargets() {
		const params = {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
		};

		this.whiteTarget = new THREE.WebGLRenderTarget(
			this.width,
			this.height,
			params,
		);
		this.sourceTarget = new THREE.WebGLRenderTarget(
			this.width,
			this.height,
			params,
		);
		this.targetA = new THREE.WebGLRenderTarget(this.width, this.height, params);
		this.targetB = new THREE.WebGLRenderTarget(this.width, this.height, params);
	}

	#createWhiteBackground() {
		this.whiteScene = new THREE.Scene();
		this.whiteCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

		this.whiteBg = new THREE.Mesh(
			new THREE.PlaneGeometry(2, 2),
			new THREE.MeshBasicMaterial({ color: 0xffffff }),
		);
		this.whiteScene.add(this.whiteBg);
	}

	#createBrushScene() {
		this.brushScene = new THREE.Scene();

		this.brush = new THREE.Mesh(
			new THREE.SphereGeometry(0.3, 32, 32),
			new THREE.MeshBasicMaterial({ color: 0xffffff }),
		);
		this.brush.scale.setScalar(1.2);
		this.brushScene.add(this.brush);
	}

	#createFBOScene() {
		this.fboScene = new THREE.Scene();
		this.fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

		this.fboMaterial = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				tDiffuse: { value: null },
				tPrev: { value: this.whiteTarget.texture },
				resolution: { value: new THREE.Vector4(this.width, this.height, 1, 1) },
			},
			vertexShader: watercolorVertexShader,
			fragmentShader: watercolorFBOShader,
		});

		this.fboQuad = new THREE.Mesh(
			new THREE.PlaneGeometry(2, 2),
			this.fboMaterial,
		);
		this.fboScene.add(this.fboQuad);
	}

	#createOverlayScene() {
		this.overlayScene = new THREE.Scene();

		this.overlayMaterial = new THREE.ShaderMaterial({
			uniforms: {
				tWatercolor: { value: this.targetA.texture },
				overlayColor: {
					value: new THREE.Color("#d2e2e9"),
				},
				time: { value: 0 },
				grainIntensity: { value: 0.075 },
			},
			vertexShader: watercolorVertexShader,
			fragmentShader: overlayFragmentShader,
			transparent: true,
			depthWrite: false,
			depthTest: false,
		});

		this.overlayQuad = new THREE.Mesh(
			new THREE.PlaneGeometry(2, 2),
			this.overlayMaterial,
		);
		this.overlayScene.add(this.overlayQuad);
	}

	#initializeWhiteTarget() {
		this.renderer.setRenderTarget(this.whiteTarget);
		this.renderer.render(this.whiteScene, this.whiteCamera);

		this.renderer.setRenderTarget(this.targetA);
		this.renderer.render(this.whiteScene, this.whiteCamera);

		this.renderer.setRenderTarget(this.targetB);
		this.renderer.render(this.whiteScene, this.whiteCamera);

		this.renderer.setRenderTarget(null);
	}

	setBrushPosition(x, y) {
		this.brush.position.set(x, y, 0);
	}

	getWatercolorTexture() {
		return this.targetA.texture;
	}

	render(mainScene, mainCamera, delta, onBeforeMainRender = null) {
		this.time += delta;

		this.renderer.setRenderTarget(this.sourceTarget);
		this.renderer.setClearColor(0x000000, 1);
		this.renderer.clear();
		this.renderer.render(this.brushScene, mainCamera);

		this.fboMaterial.uniforms.tDiffuse.value = this.sourceTarget.texture;
		this.fboMaterial.uniforms.tPrev.value = this.targetB.texture;
		this.fboMaterial.uniforms.time.value = this.time;

		this.renderer.setRenderTarget(this.targetA);
		this.renderer.render(this.fboScene, this.fboCamera);

		if (onBeforeMainRender) {
			onBeforeMainRender(this.targetA.texture);
		}

		this.renderer.setRenderTarget(this.outputTarget);
		this.renderer.clear();
		this.renderer.render(mainScene, mainCamera);

		this.renderer.autoClear = false;
		this.overlayMaterial.uniforms.tWatercolor.value = this.targetA.texture;
		this.renderer.render(this.overlayScene, this.fboCamera);
		this.renderer.autoClear = true;

		const temp = this.targetA;
		this.targetA = this.targetB;
		this.targetB = temp;
	}

	resize(width, height) {
		this.width = width;
		this.height = height;

		this.whiteTarget.setSize(width, height);
		this.sourceTarget.setSize(width, height);
		this.targetA.setSize(width, height);
		this.targetB.setSize(width, height);

		this.outputTarget.setSize(width, height);
		this.fboMaterial.uniforms.resolution.value.set(width, height, 1, 1);
		this.#initializeWhiteTarget();
	}
}

export default WatercolorOverlay;
