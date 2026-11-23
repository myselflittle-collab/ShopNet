export {};

declare global {
  interface Window {
    __shopnetBenchRecording?: boolean;
    __shopnetBenchFrameTimes?: number[];
    __shopnetBenchStats?: {
      drawCalls: number;
      triangles: number;
      points: number;
      geometries: number;
      textures: number;
      sampledAt: number;
    };
  }
}
