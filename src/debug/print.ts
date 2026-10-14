import type {
  PrintGPUBuffer,
  PrintGPUBufferArg,
} from "../struct/print_gpu_buffer";

export const printDefault: PrintGPUBuffer = (arg: PrintGPUBufferArg) => {
  let format = "";

  arg.array.forEach((e, i) => {
    const t = arg.array[i];
    format += `${t} `;
  });

  return { format, styles: [] };
};
