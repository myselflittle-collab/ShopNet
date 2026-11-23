export {};

declare global {
  interface Window {
    __shopnetBenchRecording?: boolean;
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
