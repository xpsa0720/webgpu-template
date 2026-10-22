export interface WPConfig {
  subSteps?: number;
  playSpeed?: number;
  debugMode?: boolean;
  debugPrint?: boolean;
  debugPassTimestamp?: boolean;
  debugSampleInterval?: number;
  debugViewShaderCode?: boolean;
  fps?: boolean;
}

export const DEFAULT_CONFIG: Required<WPConfig> = {
  subSteps: 1,
  playSpeed: 1,
  debugMode: false,
  debugPrint: false,
  debugPassTimestamp: false,
  debugSampleInterval: 60,
  debugViewShaderCode: false,
  fps: true,
};
