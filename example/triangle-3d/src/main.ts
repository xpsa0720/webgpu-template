import {
  WP,
  Render3DPass,
  Camera,
  Mesh,
  Geometry,
  Vertex,
  Vector3,
  Cube,
} from "@xpsa0720/webgpu";
import render3dWGSL from "./shader/render3d.wgsl?raw";
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

    // 카메라: z=3 위치에서 원점을 바라봄
    const camera = new Camera(
      new Vector3(0, 0, 3), // position
      new Vector3(0, 0, 0), // target
      60, // fov
      0.1, // near
      100, // far
    );

    // Render3DPass 생성
    const render3DPass = new Render3DPass({
      device,
      target: this.canvas,
      shaderCode: render3dWGSL,
      vertexEntryPoint: "vs",
      fragmentEntryPoint: "fs",
      vertexCount: 0,
      instanceCount: 0,
      camera,
    });

    // Cube 생성
    const cube = new Cube({
      render3DPass,
      location: new Vector3(0, 0, 0),
      rotate: new Vector3(0, 0, 60),
      scale:new Vector3(1,2,1)
    });

    render3DPass.meshs.push(cube);

    // WP passes에 등록
    this.wp.passes[0] = render3DPass;

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
      camera.rotate.y = baseRotateY -    dx * sensitivity;
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
        forward.y = 0; // 수평 이동만
        const len = Math.sqrt(forward.x * forward.x + forward.z * forward.z);
        if (len > 0.0001) {
          forward.x /= len;
          forward.z /= len;
        }
        const rotMat = createFowardRotateMatrix(camera.rotate);
        const rawForward = rotMat.multiplyVec3(forward)

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
