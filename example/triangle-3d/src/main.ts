import {
  WP,
  Camera,
  Cube,
  Vector3,
  Vector4,
  PointLight,
  AmbientLight,
  Matrial,
  Specular,
} from "@xpsa0720/webgpu";
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
    });

    const cube = new Cube({
      render3DPass,
      location: new Vector3(0, 0, 0),
      rotate: new Vector3(0, 0, 60),
      scale: new Vector3(1, 1, 1),
      matrial: new Matrial({
        color: new Vector3(0.2, 0.5, 1),
        specular: new Specular({ strength: 0.8, shininess: 2 }),
      }),
    });

    render3DPass.meshs.push(cube);

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

    // 카메라 이동 (WASD/Space/Shift)
    const moveSpeed = 0.05;
    const keys = new Set<string>();
    window.addEventListener("keydown", (e) => keys.add(e.key.toLowerCase()));
    window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

    // 카메라 회전 (마우스 드래그)
    const sensitivity = 0.003 * 0.5;
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let baseRotateX = 0;
    let baseRotateY = 0;

    this.canvas.addEventListener("mousedown", (e) => {
      dragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      baseRotateX = camera.rotate.x;
      baseRotateY = camera.rotate.y;
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      camera.rotate.y = baseRotateY - dx * sensitivity;
      camera.rotate.x = baseRotateX - dy * sensitivity;
    });
    window.addEventListener("mouseup", () => {
      dragging = false;
    });

    // 애니메이션 루프
    this.wp.animate({
      b: {},
      callBack: () => {
        const forward = camera.target.copy().subtract(camera.position);
        forward.y = 0;
        const len = Math.sqrt(forward.x * forward.x + forward.z * forward.z);
        if (len > 0.0001) {
          forward.x /= len;
          forward.z /= len;
        }
        const rotMat = createFowardRotateMatrix(camera.rotate);
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
