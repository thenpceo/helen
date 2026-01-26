import * as THREE from "three";
import WebGLContext from "../core/WebGLContext";
import ImportGltf from "../utils/ImportGltf";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import reliefFragmentShader from "../shaders/relief.frag.glsl";
import reliefVertexShader from "../shaders/relief.vert.glsl";

export default class Scene {
	constructor() {
		this.context = null;
		this.camera = null;
		this.cameraRig = null;
		this.width = 0;
		this.height = 0;
		this.aspectRatio = 0;
		this.scene = null;
		this.envMap = null;
		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();
		this.worldMouse = new THREE.Vector2();
		this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
		this.onBrushMove = null;
		this.lastInputTime = 0;
		this.idleTimeout = 0.6;
		this.isIdle = true;
		this.#init();
	}

	async #init() {
		this.#setContext();
		this.#setupScene();
		this.#setupCamera();
		this.#addLights();
		this.#addEventListeners();
		await this.#addObjects();
	}

	#setContext() {
		this.context = new WebGLContext();
	}

	#setupScene() {
		this.scene = new THREE.Scene();
		const environment = new RoomEnvironment();
		const pmremGenerator = new THREE.PMREMGenerator(this.context.renderer);
		this.envMap = pmremGenerator.fromScene(environment).texture;
		this.scene.environment = this.envMap;
		this.scene.environmentIntensity = 0.1;
	}

	#setupCamera() {
		this.#calculateAspectRatio();
		this.camera = new THREE.PerspectiveCamera(45, this.aspectRatio, 0.001, 100);
		this.camera.position.z = 2;
		this.camera.position.y = 0.4;
		this.camera.position.x = 0.4;
	}

	#addLights() {
		this.light = new THREE.DirectionalLight(0xffffff, 1.0);
		this.light.position.set(1.0, 1.0, 1.0);
		this.light.castShadow = true;
		this.light.shadow.mapSize.width = 4096;
		this.light.shadow.mapSize.height = 4096;
		this.light.shadow.camera.near = 0.1;
		this.light.shadow.camera.far = 10;
		this.light.shadow.camera.left = -10;
		this.light.shadow.camera.right = 10;
		this.light.shadow.camera.top = 10;
		this.light.shadow.camera.bottom = -10;
		this.light.shadow.bias = -0.0004;
		this.light.shadow.radius = 6.0;
		this.scene.add(this.light);

		this.light2 = new THREE.DirectionalLight(0xffffff, 1.0);
		this.light2.position.set(2.0, 0.5, 1.0);
		this.light2.castShadow = true;
		this.light2.shadow.mapSize.width = 4096;
		this.light2.shadow.mapSize.height = 4096;
		this.light2.shadow.camera.near = 0.1;
		this.light2.shadow.camera.far = 10;
		this.light2.shadow.camera.left = -10;
		this.light2.shadow.camera.right = 10;
		this.light2.shadow.camera.top = 10;
		this.light2.shadow.camera.bottom = -10;
		this.light2.shadow.bias = -0.0004;
		this.light2.shadow.radius = 6.0;
		this.scene.add(this.light2);
	}

	async #addObjects() {
		const envMapCubeUVHeight = 1024;
		const maxMip = Math.log2(envMapCubeUVHeight) - 2;
		const texelWidth = 1.0 / (3 * Math.max(Math.pow(2, maxMip), 7 * 16));
		const texelHeight = 1.0 / envMapCubeUVHeight;

		this.reliefMaterial = new THREE.ShaderMaterial({
			vertexShader: reliefVertexShader,
			fragmentShader: reliefFragmentShader,
			uniforms: {
				...THREE.UniformsLib.lights,
				time: { value: 0.0 },
				envMap: { value: this.envMap },
				envMapIntensity: { value: 0.8 },
				grainIntensity: { value: 0.075 },
				mousePosition: { value: new THREE.Vector2(0, 0) },
				popRadius: { value: 1.0 },
				popStrength: { value: 1.0 },
				tWatercolor: { value: null },
				useWatercolorPop: { value: true },
			},
			defines: {
				ENVMAP_TYPE_CUBE_UV: "",
				CUBEUV_TEXEL_WIDTH: texelWidth,
				CUBEUV_TEXEL_HEIGHT: texelHeight,
				CUBEUV_MAX_MIP: maxMip + ".0",
			},
			lights: true,
		});

		new ImportGltf(`${import.meta.env.BASE_URL}man_relief.glb`, {
			onLoad: (model) => {
				this.mesh = model;

				this.mesh.traverse((children) => {
					if (!children.isMesh) return;
					children.material = this.reliefMaterial;
				});

				this.scene.add(model);
			},
		});
	}

	#calculateAspectRatio() {
		const { width, height } = this.context.getFullScreenDimensions();
		this.width = width;
		this.height = height;
		this.aspectRatio = this.width / this.height;
	}

	#addEventListeners() {
		window.addEventListener("mousemove", this.#onPointerMove.bind(this));
		window.addEventListener("touchstart", this.#onTouchMove.bind(this), {
			passive: true,
		});
		window.addEventListener("touchmove", this.#onTouchMove.bind(this), {
			passive: true,
		});
	}

	#onTouchMove(event) {
		if (event.touches.length > 0) {
			const touch = event.touches[0];
			this.#updatePointer(touch.clientX, touch.clientY);
		}
	}

	#onPointerMove(event) {
		this.#updatePointer(event.clientX, event.clientY);
	}

	#updatePointer(clientX, clientY) {
		this.lastInputTime = performance.now() / 1000;
		this.isIdle = false;

		this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;

		this.#updateBrushPosition();
	}

	#updateBrushPosition() {
		this.raycaster.setFromCamera(this.mouse, this.camera);
		const intersectPoint = new THREE.Vector3();
		this.raycaster.ray.intersectPlane(this.plane, intersectPoint);

		if (!intersectPoint) return;
		this.worldMouse.set(intersectPoint.x, intersectPoint.y);

		this.reliefMaterial &&
			this.reliefMaterial.uniforms.mousePosition.value.copy(this.worldMouse);

		this.onBrushMove && this.onBrushMove(intersectPoint.x, intersectPoint.y);
	}

	#simulateIdleMovement(elapsed) {
		// Gentle figure-8 pattern
		const speed = 0.8;
		const radiusX = 0.3;
		const radiusY = 0.5;

		this.mouse.x = Math.sin(elapsed * speed) * radiusX;
		this.mouse.y = Math.sin(elapsed * speed * 2) * radiusY;

		this.#updateBrushPosition();
	}

	animate(delta, elapsed) {
		this.reliefMaterial && (this.reliefMaterial.uniforms.time.value = elapsed);
		const currentTime = performance.now() / 1000;
		const timeSinceInput = currentTime - this.lastInputTime;

		if (timeSinceInput > this.idleTimeout) {
			this.isIdle = true;
			this.#simulateIdleMovement(elapsed);
		}
	}

	setWatercolorTexture(texture) {
		this.reliefMaterial &&
			(this.reliefMaterial.uniforms.tWatercolor.value = texture);
	}

	onResize(width, height) {
		this.width = width;
		this.height = height;
		this.aspectRatio = width / height;

		this.camera.aspect = this.aspectRatio;
		this.camera.updateProjectionMatrix();
	}
}
