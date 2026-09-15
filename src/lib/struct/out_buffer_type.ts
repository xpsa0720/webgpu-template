const PrintType = {
  u32: "u32",
  f32: "f32",
} as const;

export type PrintType = (typeof PrintType)[keyof typeof PrintType];
