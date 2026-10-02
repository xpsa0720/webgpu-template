export interface WPConfig {
  debugMode?: boolean;
  debugPrint?: boolean;
  debugPassTimestamp?: boolean;
  debugSampleInterval?: number;
  fps?: boolean;
  workgroupSizeX?: number;
  workgroupSizeY?: number;
  workgroupSize2dX?: number;
  workgroupSize2dY?: number;
}

export const DEFAULT_CONFIG: Required<WPConfig> = {
  debugMode: false,
  debugPrint: false,
  debugPassTimestamp: false,
  debugSampleInterval: 60,
  fps: true,
  workgroupSizeX: 128,
  workgroupSizeY: 128,
  workgroupSize2dX: 16,
  workgroupSize2dY: 16,
};
