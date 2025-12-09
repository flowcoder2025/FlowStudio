/**
 * Image Compression Utility
 *
 * 고화질 이미지를 자동으로 압축하여 API body size 제한을 회피합니다.
 * - 목표 크기: 2MB 이하 (base64 인코딩 후 약 2.6MB)
 * - 품질 유지: Progressive quality reduction으로 최적 품질 보장
 * - 성능: Canvas API를 사용한 클라이언트 측 처리
 */

export interface CompressionOptions {
  maxSizeMB?: number; // 목표 파일 크기 (MB)
  maxWidthOrHeight?: number; // 최대 너비 또는 높이 (픽셀)
  initialQuality?: number; // 초기 압축 품질 (0-1)
  minQuality?: number; // 최소 압축 품질 (0-1)
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxSizeMB: 2, // 2MB 목표
  maxWidthOrHeight: 2048, // 2K 해상도로 제한
  initialQuality: 0.9, // 높은 품질로 시작
  minQuality: 0.6, // 최소 품질 제한
};

/**
 * File 객체를 압축된 base64 문자열로 변환
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 1. File → Image 로드
  const image = await loadImageFromFile(file);

  // 2. 리사이징이 필요한지 확인
  const { width, height } = calculateResizedDimensions(
    image.width,
    image.height,
    opts.maxWidthOrHeight
  );

  // 3. Canvas로 리사이징
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context를 생성할 수 없습니다.');
  }

  // 고품질 렌더링 설정
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);

  // 4. Progressive quality reduction으로 목표 크기 달성
  let quality = opts.initialQuality;
  let compressed = canvas.toDataURL('image/jpeg', quality);
  let iterations = 0;
  const maxIterations = 10;

  while (
    getBase64SizeInMB(compressed) > opts.maxSizeMB &&
    quality > opts.minQuality &&
    iterations < maxIterations
  ) {
    quality -= 0.05;
    compressed = canvas.toDataURL('image/jpeg', quality);
    iterations++;
  }

  // 5. 여전히 큰 경우 추가 리사이징
  if (getBase64SizeInMB(compressed) > opts.maxSizeMB) {
    const reductionFactor = 0.8;
    canvas.width = Math.floor(width * reductionFactor);
    canvas.height = Math.floor(height * reductionFactor);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    compressed = canvas.toDataURL('image/jpeg', opts.minQuality);
  }

  return compressed;
}

/**
 * base64 문자열을 압축 (이미 base64인 경우)
 */
export async function compressBase64Image(
  base64String: string,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 1. Base64 → Image 로드
  const image = await loadImageFromBase64(base64String);

  // 2. 리사이징이 필요한지 확인
  const { width, height } = calculateResizedDimensions(
    image.width,
    image.height,
    opts.maxWidthOrHeight
  );

  // 3. Canvas로 리사이징
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context를 생성할 수 없습니다.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);

  // 4. Progressive quality reduction
  let quality = opts.initialQuality;
  let compressed = canvas.toDataURL('image/jpeg', quality);
  let iterations = 0;
  const maxIterations = 10;

  while (
    getBase64SizeInMB(compressed) > opts.maxSizeMB &&
    quality > opts.minQuality &&
    iterations < maxIterations
  ) {
    quality -= 0.05;
    compressed = canvas.toDataURL('image/jpeg', quality);
    iterations++;
  }

  return compressed;
}

/**
 * File 객체에서 Image 엘리먼트 로드
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Base64 문자열에서 Image 엘리먼트 로드
 */
function loadImageFromBase64(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
    img.src = base64;
  });
}

/**
 * 종횡비를 유지하면서 리사이징된 크기 계산
 */
function calculateResizedDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number
): { width: number; height: number } {
  const maxSize = Math.max(originalWidth, originalHeight);

  if (maxSize <= maxDimension) {
    // 이미 목표 크기 이하
    return { width: originalWidth, height: originalHeight };
  }

  const ratio = maxDimension / maxSize;
  return {
    width: Math.floor(originalWidth * ratio),
    height: Math.floor(originalHeight * ratio),
  };
}

/**
 * Base64 문자열의 크기를 MB 단위로 계산
 */
function getBase64SizeInMB(base64String: string): number {
  // Base64 데이터 부분만 추출 (data:image/jpeg;base64, 제거)
  const base64Data = base64String.split(',')[1] || base64String;

  // Base64 문자열 길이 → 바이트 크기 (padding 고려)
  const padding = (base64Data.match(/=/g) || []).length;
  const sizeInBytes = (base64Data.length * 3) / 4 - padding;

  return sizeInBytes / (1024 * 1024);
}

/**
 * 파일 크기가 제한을 초과하는지 확인
 */
export function isFileTooLarge(file: File, maxSizeMB: number = 4): boolean {
  const fileSizeMB = file.size / (1024 * 1024);
  return fileSizeMB > maxSizeMB;
}

/**
 * Base64 문자열 크기가 제한을 초과하는지 확인
 */
export function isBase64TooLarge(base64String: string, maxSizeMB: number = 4): boolean {
  return getBase64SizeInMB(base64String) > maxSizeMB;
}

/**
 * 압축 결과 정보 반환
 */
export interface CompressionResult {
  compressed: string;
  originalSizeMB: number;
  compressedSizeMB: number;
  reductionPercent: number;
}

/**
 * 압축 결과와 통계를 함께 반환
 */
export async function compressImageWithStats(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const originalSizeMB = file.size / (1024 * 1024);
  const compressed = await compressImage(file, options);
  const compressedSizeMB = getBase64SizeInMB(compressed);
  const reductionPercent = ((originalSizeMB - compressedSizeMB) / originalSizeMB) * 100;

  return {
    compressed,
    originalSizeMB,
    compressedSizeMB,
    reductionPercent,
  };
}
