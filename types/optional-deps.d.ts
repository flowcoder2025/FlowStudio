/**
 * Ambient type declarations for optional dependencies.
 * These modules are dynamically imported and may not be installed.
 */

declare module "@upstash/redis" {
  export class Redis {
    constructor(opts: { url: string; token: string });
    get(key: string): Promise<string | null>;
    set(key: string, value: string, options?: { ex?: number }): Promise<unknown>;
    del(key: string): Promise<unknown>;
  }
}

/**
 * onnxruntime-web: package.json "exports" prevents type resolution.
 * The actual types exist at node_modules/onnxruntime-web/types.d.ts
 * but TypeScript cannot resolve them via the exports map.
 */
declare module "onnxruntime-web" {
  export const env: {
    wasm: { wasmPaths: string; numThreads: number; [key: string]: unknown };
    [key: string]: unknown;
  };
  export class InferenceSession {
    static create(
      model: ArrayBuffer | string,
      options?: Record<string, unknown>
    ): Promise<InferenceSession>;
    run(
      feeds: Record<string, unknown>,
      options?: Record<string, unknown>
    ): Promise<Record<string, unknown>>;
    release(): void;
  }
  export class Tensor {
    constructor(
      type: string,
      data: Float32Array | Uint8Array | Int32Array,
      dims: number[]
    );
    readonly data: Float32Array | Uint8Array | Int32Array;
    readonly dims: readonly number[];
    readonly type: string;
  }
}
