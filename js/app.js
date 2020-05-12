var camera, scene, renderer, controls, slider;
var pivotCamera;
var pivotObj;
var cameraTarget = new THREE.Vector3(0, 1, 0);
var relativeCameraOffset = new THREE.Vector3(0, 3, 3);

var globalPlane = new THREE.Plane(new THREE.Vector3(-100, 0, 0), 0.1);
var localPlane = new THREE.Plane(new THREE.Vector3(0, -1.5, 0), 0.8);

var cutPlaneDistance = 1.0;
var explodeDistance = 0.0;
var consoleID = document.getElementById('console');

var sliderDiv = document.createElement('DIV');
sliderDiv.className = 'slidecontainer';

var clipSlider = createSlider('clipSlider', 'cutPlaneDistance', 0, 1)
var explodeSlider = createSlider('explodeSlider', 'explodeDistance', 0, 1, 'explodeGeometry')


function init() {

	container = document.createElement('div');
	slider = document.createElement('div');

	document.body.appendChild(container);
	document.body.appendChild(slider);

	// pivotCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
	// camera.position.set(-2, 0, -2);
	camera.position.set(relativeCameraOffset.x, relativeCameraOffset.y, relativeCameraOffset.z);
	// pivotCamera.add(camera)
	scene = new THREE.Scene();

	var light = new THREE.AmbientLight(0xaaaaaa, 0.3);
	light.position.set(0, 0, 0);
	// light.castShadow = true;
	scene.add(light);

	var planeNormal = new THREE.Vector3(0, 0, 0);
	planeNormal.copy(camera.position).normalize();

	var path = 'models/Bridge2/';
	var format = '.jpg';
	var urls = [
		path + 'posx' + format, path + 'negx' + format,
		path + 'posy' + format, path + 'negy' + format,
		path + 'posz' + format, path + 'negz' + format
	];

	var reflectionCube = new THREE.CubeTextureLoader().load(urls);
	reflectionCube.format = THREE.RGBFormat;

	var loader = new THREE.GLTFLoader().setPath('./models/');
	loader.load('scene.gltf', function (gltf) {
		gltf.scene.traverse(function (child) {
			if (child.type == "DirectionalLight") {
				// child.castShadow = true;
			}
			if (child.isMesh) {
				child.material.envMap = reflectionCube;
				child.material.side = THREE.DoubleSide;
				child.receiveShadow = true;
				child.material.clippingPlanes = [localPlane];
				child.material.clipShadows = true;
				child.geometry.computeBoundingBox()
			};
		});
		scene.add(gltf.scene);
	});

	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.outputEncoding = THREE.sRGBEncoding;

	// ***** Clipping setup (renderer): *****
	var globalPlanes = [globalPlane]; //,
	// Empty = Object.freeze([]);
	// renderer.clippingPlanes = globalPlanes;
	renderer.localClippingEnabled = true;

	container.appendChild(renderer.domElement);


	var envBackground = new THREE.SphereBufferGeometry(5, 10, 10);
	envBackground.scale(-1, 1, 1);
	envBackground.position = new THREE.Vector3(0, 4, 0);
	var material = new THREE.MeshStandardMaterial({
		map: new THREE.TextureLoader().load('./models/textures/2294472375_24a3b8ef46_o.jpg'),
		receiveShadow: false
	});
	var mesh = new THREE.Mesh(envBackground, material);
	mesh.add(camera)
	scene.add(mesh);
	var helperGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
	var helperMaterial = new THREE.MeshBasicMaterial({
		color: 0x000000,
		// wireframe: true
		transparent: true,
		opacity: 0
	});
	pivotObj = new THREE.Mesh(helperGeometry, helperMaterial);
	scene.add(pivotObj);

	controlsOrientation = new THREE.DeviceOrientationControls(pivotObj);
	// controls = new THREE.OrbitControls(camera, renderer.domElement);
	// controls.target.set(0, 1, 0);
	// controls.update();
	// controls.enableDamping = true;
	// controls.autoRotate = true;
	// controls.autoRotateSpeed = 4.0;

	window.addEventListener('resize', onWindowResize, false);
};

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
};

function animate() {

	requestAnimationFrame(animate);
	// controls.update();
	controlsOrientation.update();
	cameraFollow()
	// var camPos = cameraFollow()
	// camera.position.set(camPos.x, camPos.y, camPos.z);
	camera.lookAt(cameraTarget)
	// camera.updateProjectionMatrix();
	var planeNormal = new THREE.Vector3(-camera.position.x, 0, -camera.position.z).normalize();
	localPlane.set(planeNormal, cutPlaneDistance);
	renderer.render(scene, camera);

};

function explodeGeometry(distance) {
	cameraTarget.multiplyScalar(distance);
	scene.traverse(function (child) {
		if (child.isMesh) {
			if (child.geometry.boundingBox !== null) {
				var verticalDistance = child.geometry.boundingBox.min.y;
				child.position.y = distance * verticalDistance;
			}
		}
	})

}

function createSlider(name, output, min, max, func) {
	var slider = document.createElement('input');
	slider.id = name;
	slider.type = 'range';
	slider.min = min;
	slider.max = max;
	slider.value = window[output];
	slider.step = 0.01;
	slider.className = 'slider ' + func
	slider.oninput = function () {
		window[output] = this.value;
		if (func) {
			window[func](this.value)
		}
	};

	sliderDiv.appendChild(slider);
	document.body.appendChild(sliderDiv);
};

function cameraFollow() {

	// var v = new THREE.Vector3();
	// doOffset(4, pivotObj.matrix)
	// var NM = new THREE.Matrix4();

	// function doOffset(distance, objectMatrix) {

	// 	v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
	// 	v.multiplyScalar(-distance);
	// 	logIt('matrix', NM.extractRotation(objectMatrix))

	// };
	var cameraOffset = relativeCameraOffset.applyMatrix4(pivotObj.matrixWorld);


	camera.position.x = cameraOffset.x;
	camera.position.y = cameraOffset.y;
	camera.position.z = cameraOffset.z;
	// camera.lookAt(pivotObj.position);
	// return v
};

function logIt(name, value) {
	consoleID.innerHTML = name + ': ' + JSON.stringify(value) + '<br>quat: ' + JSON.stringify(pivotObj.quaternion);
}