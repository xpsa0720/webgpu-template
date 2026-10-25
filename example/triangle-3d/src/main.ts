import {
  WP,
  Camera,
  Cube,
  Sphere,
  Vector3,
  Vector4,
  PointLight,
  AmbientLight,
  Matrial,
  Specular,
  Mat3x3,
  InstanceMesh,
  Geometry,
  Mesh,
  loadModel,
  loadOBJ,
  loadGLTF,
  Node,
} from "@xpsa0720/webgpu";
import { toRadian } from "@xpsa0720/webgpu/dist/util/math";
import { createFowardRotateMatrix } from "@xpsa0720/webgpu/dist/util/matrix";

class App3D {
  canvas: HTMLCanvasElement;
  wp: WP;

  constructor() {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.wp = new WP({ canvas: this.canvas });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  async init() {
    await this.wp.init();
    this.resize();
    window.addEventListener("resize", () => this.resize());

    const device = this.wp.device!;

    const camera = new Camera(
      new Vector3(0, 0, 3),
      new Vector3(0, 0, 0),
      60,
      0.1,
      100,
    );

    const render3DPass = this.wp.createRender3DPass(0, {
      target: this.canvas,
      camera,
      blend: true,
      debugMode: false,
      
    });

    const cube = new Cube({
      render3DPass,
      location: new Vector3(2, 0, 0),
      rotate: new Vector3(0, 0, 60),
      scale: new Vector3(1, 1, 1),
      matrial: new Matrial({
        color: new Vector3(0.2, 0.5, 1),
        specular: new Specular({ strength: 0.8, shininess: 2 }),
      }),
    });

    const sphere = new Sphere({
      render3DPass,
      location: new Vector3(2, 5, 0),
      matrial: new Matrial({
        color: new Vector3(1, 0.3, 0.3),
        specular: new Specular({ strength: 0.8, shininess: 4 }),
      }),
    });

    render3DPass.meshs.push(cube);
    render3DPass.meshs.push(sphere);

    // === OBJ 로더 테스트: public/test_cube.obj 로드 ===
    try {
      const objRoot = await loadOBJ(render3DPass, "/test_cube.obj");
      console.log(`OBJ 로드 성공: meshs=${objRoot.meshs.length}`);
      // test_cube.obj에는 .mtl이 없어서 기본 회색 → 테스트용 색 지정
      const objMatrial = new Matrial({
        color: new Vector3(0.2, 1, 0.5),
        specular: new Specular({ strength: 0.8, shininess: 4 }),
      });
      objRoot.meshs.forEach((mesh) => (mesh.matrial = objMatrial));
      objRoot.location = new Vector3(-2, 0, 0);
      objRoot.updateWorld();
      render3DPass.nodes.push(objRoot);
      console.log("OBJ 노드 렌더링 등록 완료");
    } catch (e) {
      console.error("OBJ 로드 실패:", e);
    }

    // === 파일 드래그 앤 드롭으로 3D 모델 로드 (OBJ/glTF/GLB) ===
    this.canvas.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
    this.canvas.addEventListener("drop", async (e) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      console.log(`파일 드롭: ${Array.from(files).map(f => f.name).join(", ")}`);
      try {
        // FileList 전체 전달 (.gltf + .bin / .obj + .mtl 등 동반 파일 지원)
        const root = await loadModel(render3DPass, files);
        console.log(`모델 로드 성공: 최상위 노드 ${root.children.length}개, 루트 meshs ${root.meshs.length}개`);
        render3DPass.nodes.push(root);
        console.log("드롭된 모델 렌더링 등록 완료");
      } catch (err) {
        console.error("모델 로드 실패:", err);
      }
    });

    // InstanceMesh 테스트: 큐브 10000개 랜덤 배치
    const templateCube = new Cube({
      render3DPass,
      location: new Vector3(0, 0, 0),
      scale: new Vector3(0.1,0.1,0.1)
    });

    // const instanceCubes = new InstanceMesh({
    //   render3DPass,
    //   geometry: templateCube.geometry,
    //   instanceInfo: InstanceMesh.randomInstanceInfo(
    //     100000,
    //     new Matrial({
    //       color: new Vector3(0.3, 1, 0.3),
    //       specular: new Specular({ strength: 0.5, shininess: 2 }),
    //     }), 
    //   ),
    // });
    // render3DPass.instanceMesh.push(instanceCubes);

    // === Node 테스트 ===
    // 1) 계층: 태양 → 지구 → 달 (부모 회전 → 자식 공전)
    const sun = new Node({
      render3DPass,
      location: new Vector3(0, 3, -6),
      meshs: [new Sphere({ render3DPass, location: new Vector3(0, 0, 0), radius: 0.8,
        matrial: new Matrial({ color: new Vector3(1, 0.8, 0.2) }) })],
    });
    const earth = new Node({
      render3DPass,
      location: new Vector3(3, 0, 0), // 태양 기준
      meshs: [new Sphere({ render3DPass, location: new Vector3(0, 0, 0), radius: 0.4,
        matrial: new Matrial({ color: new Vector3(0.2, 0.5, 1) }) })],
    });
    const moon = new Node({
      render3DPass,
      location: new Vector3(1, 0, 0), // 지구 기준
      meshs: [new Sphere({ render3DPass, location: new Vector3(0, 0, 0), radius: 0.15,
        matrial: new Matrial({ color: new Vector3(0.8, 0.8, 0.8) }) })],
    });
    sun.addChild(earth);
    earth.addChild(moon);
    render3DPass.nodes.push(sun); // 루트만 등록

    // 2) transform: 위아래 이동 + 회전 + 축마다 다른 크기 (normalMat 확인용)
    const box = new Node({
      render3DPass,
      location: new Vector3(-4, 0, -3),
      meshs: [new Cube({ render3DPass, location: new Vector3(0, 0, 0),
        matrial: new Matrial({ color: new Vector3(1, 0.4, 0.8) }) })],
    });
    render3DPass.nodes.push(box);

    const startTime = performance.now();
    const updateTestNodes = () => {
      const t = (performance.now() - startTime) / 1000;

      sun.rotate.y = t * 0.5;   // 지구 공전
      earth.rotate.y = t * 2;   // 달 공전
      sun.updateWorld();        // 루트에서 한 번 → 지구, 달까지 갱신

      box.location.y = Math.sin(t * 2);
      box.rotate.x = t;
      box.rotate.y = t * 0.7;
      box.scale = new Vector3(1 + 0.5 * Math.sin(t * 3), 1, 1);
      box.updateWorld();
    };

    // PointLight 추가
    render3DPass.addLight(
      new PointLight({ position: new Vector4(-2, 2, 2, 1), intensity: 10 }),
    );

    // AmbientLight 추가
    render3DPass.addLight(new AmbientLight({ intensity: 0.2 }));

    // 마우스 휠로 opacity 조절
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        cube.matrial.opacity = Math.max(
          0,
          Math.min(1, cube.matrial.opacity - e.deltaY * 0.001),
        );
        console.log("opacity:", cube.matrial.opacity.toFixed(2));
      },
      { passive: false },
    );

    // PointLight 동적 추가/제거 테스트 (1: 추가, 2: 제거)
    let dynamicLights: PointLight[] = [];
    window.addEventListener("keydown", (e) => {
      if (e.key === "1") {
        const light = new PointLight({
          position: new Vector4(
            Math.random() * 6 - 3,
            Math.random() * 6 - 3,
            Math.random() * 6 - 3,
            1,
          ),
          color: new Vector4(Math.random(), Math.random(), Math.random(), 1),
        });
        render3DPass.addLight(light);
        dynamicLights.push(light);
        console.log("PointLight 추가, 총:", dynamicLights.length);
      }
      if (e.key === "2" && dynamicLights.length > 0) {
        const light = dynamicLights.pop()!;
        render3DPass.removeLight(light);
        console.log("PointLight 제거, 총:", dynamicLights.length);
      }
    });

    // P키: 인스턴스 범위 경계에서 바깥을 바라봄 (일부만 보이는 상황)
    window.addEventListener("keydown", (e) => {
      if (e.key === "p" || e.key === "P") {
        camera.position.x = 90;
        camera.position.y = 0;
        camera.position.z = 0;
        camera.target.x = 100;
        camera.target.y = 0;
        camera.target.z = 0;
        camera.rotate.x = 0;
        camera.rotate.y = 0;
        camera.rotate.z = 0;
        console.log("카메라 이동: 경계 (90,0,0) → 바깥 바라봄");
      }
    });

    // 카메라 이동 (WASD/Space/Shift)
    const moveSpeed = 0.05;
    const keys = new Set<string>();
    window.addEventListener("keydown", (e) => keys.add(e.key.toLowerCase()));
    window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

    // 카메라 회전 (Pointer Lock: 캔버스 클릭 시 커서 숨김, ESC로 해제)
    const sensitivity = 0.003 * 0.5;

    this.canvas.addEventListener("click", () => {
      this.canvas.requestPointerLock();
    });
    window.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement !== this.canvas) return;

      //   const forward = camera.target.copy().subtract(camera.position);
      //   const len = Math.sqrt(forward.x * forward.x + forward.z * forward.z);
      //   if (len > 0.0001) {
      //     forward.x /= len;
      //     forward.z /= len;
      //   }

      //   const moveX = e.movementX * Math.cos(camera.rotate.y) + e.movementX *Math.sin(camera.rotate.y)
      //   const moveY = e.movementY * Math.cos(camera.rotate.x) - e.movementY *Math.sin(camera.rotate.x)

      //   camera.rotate.y -= moveX * sensitivity;
      //   camera.rotate.x -= moveY * sensitivity;
      const PITCH_LIMIT = toRadian(85);
      camera.rotate.y -= e.movementX * sensitivity; // yaw는 제한 없음
      camera.rotate.x -= e.movementY * sensitivity;
      camera.rotate.x = Math.max(
        -PITCH_LIMIT,
        Math.min(PITCH_LIMIT, camera.rotate.x),
      );
    });

    // 애니메이션 루프
    this.wp.animate({
      b: {},
      callBack: () => {
        updateTestNodes();
        const forward = camera.target.copy().subtract(camera.position);
        // forward.y = 0;
        const len = Math.sqrt(forward.x * forward.x + forward.z * forward.z);
        if (len > 0.0001) {
          forward.x /= len;
          forward.z /= len;
        }
        const rotMat = createFowardRotateMatrix(new Vector3(0, camera.rotate.y, 0));
        const rawForward = rotMat.multiplyVec3(forward);

        const right = new Vector3(-rawForward.z, 0, rawForward.x);

        if (keys.has("w")) {
          camera.position.x += rawForward.x * moveSpeed;
          camera.position.z += rawForward.z * moveSpeed;
          camera.target.x += rawForward.x * moveSpeed;
          camera.target.z += rawForward.z * moveSpeed;
        }
        if (keys.has("s")) {
          camera.position.x -= rawForward.x * moveSpeed;
          camera.position.z -= rawForward.z * moveSpeed;
          camera.target.x -= rawForward.x * moveSpeed;
          camera.target.z -= rawForward.z * moveSpeed;
        }
        if (keys.has("a")) {
          camera.position.x -= right.x * moveSpeed;
          camera.position.z -= right.z * moveSpeed;
          camera.target.x -= right.x * moveSpeed;
          camera.target.z -= right.z * moveSpeed;
        }
        if (keys.has("d")) {
          camera.position.x += right.x * moveSpeed;
          camera.position.z += right.z * moveSpeed;
          camera.target.x += right.x * moveSpeed;
          camera.target.z += right.z * moveSpeed;
        }
        if (keys.has(" ")) {
          camera.position.y += moveSpeed;
          camera.target.y += moveSpeed;
        }
        if (keys.has("shift")) {
          camera.position.y -= moveSpeed;
          camera.target.y -= moveSpeed;
        }
      },
    });
  }
}

const app = new App3D();
app.init();
