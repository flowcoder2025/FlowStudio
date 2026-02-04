/**
 * Image Compression Utility
 * Contract: UX 개선 - 페이로드 크기 제한 해결
 *
 * 클라이언트 측에서 이미지를 압축하여 API 요청 시 페이로드 크기를 줄입니다.
 */

export interface CompressOptions {
  /** 최대 파일 크기 (MB). 기본값: 2MB */
  maxSizeMB?: number;
  /** 최대 너비/높이 (px). 기본값: 2048px */
  maxWidthOrHeight?: number;
  /** 압축 품질 (0-1). 기본값: 0.8 */
  quality?: number;
  /** 출력 형식. 기본값: 원본 형식 유지 */
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2048,
  quality: 0.8,
  outputType: 'image/jpeg',
};

/**
 * 이미지 파일을 지정된 크기로 압축합니다.
 *
 * @param file - 압축할 이미지 파일
 * @param options - 압축 옵션
 * @returns 압축된 Blob
 *
 * @example
 * ```ts
 * const compressed = await compressImage(file, { maxSizeMB: 2 });
 * ```
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const maxSizeBytes = opts.maxSizeMB * 1024 * 1024;

  // 이미 충분히 작으면 그대로 반환
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // 크기 계산
      let { width, height } = img;
      const maxDim = opts.maxWidthOrHeight;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height / width) * maxDim);
          width = maxDim;
        } else {
          width = Math.round((width / height) * maxDim);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // 그리기
      ctx.drawImage(img, 0, 0, width, height);

      // 품질 조절하며 압축
      let quality = opts.quality;
      const outputType = opts.outputType;

      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }

            // 목표 크기 이하면 완료
            if (blob.size <= maxSizeBytes || quality <= 0.1) {
              resolve(blob);
              return;
            }

            // 품질 낮추고 재시도
            quality -= 0.1;
            tryCompress();
          },
          outputType,
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 이미지 파일의 예상 base64 크기를 계산합니다.
 * Base64는 원본 대비 약 1.37배 크기가 됩니다.
 *
 * @param fileSize - 파일 크기 (bytes)
 * @returns 예상 base64 크기 (bytes)
 */
export function estimateBase64Size(fileSize: number): number {
  return Math.ceil(fileSize * 1.37);
}

/**
 * 파일이 페이로드 제한을 초과하는지 확인합니다.
 *
 * @param file - 확인할 파일
 * @param limitMB - 제한 크기 (MB). 기본값: 4MB
 * @returns 초과 여부
 */
export function exceedsPayloadLimit(file: File, limitMB: number = 4): boolean {
  const estimatedSize = estimateBase64Size(file.size);
  const limitBytes = limitMB * 1024 * 1024;
  return estimatedSize > limitBytes;
}

/**
 * 이미지를 필요시 압축하여 업로드 준비를 합니다.
 * 2MB 초과 시 자동 압축, 4MB 초과 시 경고 반환
 *
 * @param file - 처리할 이미지 파일
 * @returns 처리 결과
 */
export async function prepareImageForUpload(file: File): Promise<{
  blob: Blob;
  wasCompressed: boolean;
  warning?: string;
}> {
  const twoMB = 2 * 1024 * 1024;
  const fourMB = 4 * 1024 * 1024;

  // 2MB 이하면 그대로
  if (file.size <= twoMB) {
    return { blob: file, wasCompressed: false };
  }

  // 압축 시도
  const compressed = await compressImage(file, { maxSizeMB: 2 });

  // 압축 후에도 4MB 초과면 경고
  const estimatedSize = estimateBase64Size(compressed.size);
  if (estimatedSize > fourMB) {
    return {
      blob: compressed,
      wasCompressed: true,
      warning: '이미지 크기가 매우 큽니다. 업로드가 실패할 수 있습니다.',
    };
  }

  return { blob: compressed, wasCompressed: true };
}
