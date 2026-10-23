import * as THREE from "three";

const INSTANCE_COUNT = 1000000;
const RANDOM_RANGE = 100;
const CUBE_SCALE = 0.1;

// 렌더러
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 카메라 — triangle-3d와 동일 설정
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 3);
camera.lookAt(0, 0, 0);

// 씬
const scene = new THREE.Scene();

// 라이트 — triangle-3d와 동일
const pointLight = new THREE.PointLight(0xffffff, 10);
pointLight.position.set(-2, 2, 2);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// InstancedMesh — 큐브 100,000개
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshPhongMaterial({
  color: new THREE.Color(0.3, 1, 0.3),
  shininess: 2,
  specular: new THREE.Color(0.5, 0.5, 0.5),
});

const instancedMesh = new THREE.InstancedMesh(geometry, material, INSTANCE_COUNT);
const dummy = new THREE.Object3D();

for (let i = 0; i < INSTANCE_COUNT; i++) {
  dummy.position.set(
    (Math.random() * 2 - 1) * RANDOM_RANGE,
    (Math.random() * 2 - 1) * RANDOM_RANGE,
    (Math.random() * 2 - 1) * RANDOM_RANGE,
  );
  dummy.scale.set(CUBE_SCALE, CUBE_SCALE, CUBE_SCALE);
  dummy.rotation.set(0, 0, 0);
  dummy.updateMatrix();
  instancedMesh.setMatrixAt(i, dummy.matrix);
}
instancedMesh.instanceMatrix.needsUpdate = true;
scene.add(instancedMesh);

// 리사이즈
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// P키: 인스턴스 범위 경계에서 바깥을 바라봄 (일부만 보이는 상황)
window.addEventListener("keydown", (e) => {
  if (e.key === "p" || e.key === "P") {
    camera.position.set(90, 0, 0);
    camera.lookAt(100, 0, 0);
    yaw = 0;
    pitch = 0;
    console.log("카메라 이동: 경계 (90,0,0) → 바깥 바라봄");
  }
});

// 카메라 이동 (WASD/Space/Shift)
const moveSpeed = 0.05;
const keys = new Set<string>();
window.addEventListener("keydown", (e) => keys.add(e.key.toLowerCase()));
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

// 카메라 회전 (Pointer Lock)
const sensitivity = 0.003 * 0.5;
let yaw = 0;
let pitch = 0;

renderer.domElement.addEventListener("click", () => {
  renderer.domElement.requestPointerLock();
});

window.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  const PITCH_LIMIT = (85 * Math.PI) / 180;
  yaw -= e.movementX * sensitivity;
  pitch -= e.movementY * sensitivity;
  pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
});

// FPS 측정
const fpsEl = document.getElementById("fps")!;
let frameCount = 0;
let lastTime = performance.now();

function updateFPS() {
  frameCount++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    fpsEl.textContent = `FPS: ${frameCount} | Instances: ${INSTANCE_COUNT.toLocaleString()}`;
    frameCount = 0;
    lastTime = now;
  }
}

// 애니메이션 루프
function animate() {
  requestAnimationFrame(animate);

  // 카메라 방향 계산
  const forward = new THREE.Vector3(0, 0, -1);
  const euler = new THREE.Euler(pitch, yaw, 0, "YXZ");
  forward.applyEuler(euler);

  const right = new THREE.Vector3();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  if (keys.has("w")) {
    camera.position.addScaledVector(new THREE.Vector3(forward.x, 0, forward.z).normalize(), moveSpeed);
  }
  if (keys.has("s")) {
    camera.position.addScaledVector(new THREE.Vector3(forward.x, 0, forward.z).normalize(), -moveSpeed);
  }
  if (keys.has("a")) {
    camera.position.addScaledVector(right, -moveSpeed);
  }
  if (keys.has("d")) {
    camera.position.addScaledVector(right, moveSpeed);
  }
  if (keys.has(" ")) {
    camera.position.y += moveSpeed;
  }
  if (keys.has("shift")) {
    camera.position.y -= moveSpeed;
  }

  // 카메라가 바라보는 방향 업데이트
  const lookTarget = camera.position.clone().add(forward);
  camera.lookAt(lookTarget);

  renderer.render(scene, camera);
  updateFPS();
}

animate();
