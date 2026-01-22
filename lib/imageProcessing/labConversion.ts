/**
 * LAB Color Space Conversion
 * Used for color transfer (Reinhard algorithm) and advanced color manipulation
 */

import type { RGB, LAB, HSL, HSV } from './types';

// =====================================================
// Constants
// =====================================================

// D65 illuminant reference white point
const REF_X = 95.047;
const REF_Y = 100.0;
const REF_Z = 108.883;

// LAB conversion threshold
const EPSILON = 0.008856;
const KAPPA = 903.3;

// =====================================================
// RGB <-> XYZ Conversions
// =====================================================

/**
 * Convert sRGB to linear RGB
 */
function srgbToLinear(value: number): number {
  const v = value / 255;
  return v <= 0.04045
    ? v / 12.92
    : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Convert linear RGB to sRGB
 */
function linearToSrgb(value: number): number {
  const v = value <= 0.0031308
    ? value * 12.92
    : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, v * 255)));
}

/**
 * Convert RGB to XYZ color space
 */
export function rgbToXyz(rgb: RGB): { x: number; y: number; z: number } {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  // sRGB to XYZ matrix (D65 illuminant)
  return {
    x: (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100,
    y: (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) * 100,
    z: (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) * 100,
  };
}

/**
 * Convert XYZ to RGB color space
 */
export function xyzToRgb(xyz: { x: number; y: number; z: number }): RGB {
  const x = xyz.x / 100;
  const y = xyz.y / 100;
  const z = xyz.z / 100;

  // XYZ to sRGB matrix (D65 illuminant)
  const r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  const g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
  const b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  return {
    r: linearToSrgb(r),
    g: linearToSrgb(g),
    b: linearToSrgb(b),
  };
}

// =====================================================
// XYZ <-> LAB Conversions
// =====================================================

/**
 * Helper function for XYZ to LAB conversion
 */
function xyzToLabHelper(value: number): number {
  return value > EPSILON
    ? Math.cbrt(value)
    : (KAPPA * value + 16) / 116;
}

/**
 * Helper function for LAB to XYZ conversion
 */
function labToXyzHelper(value: number): number {
  const cube = value * value * value;
  return cube > EPSILON ? cube : (116 * value - 16) / KAPPA;
}

/**
 * Convert XYZ to LAB color space
 */
export function xyzToLab(xyz: { x: number; y: number; z: number }): LAB {
  const x = xyzToLabHelper(xyz.x / REF_X);
  const y = xyzToLabHelper(xyz.y / REF_Y);
  const z = xyzToLabHelper(xyz.z / REF_Z);

  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
}

/**
 * Convert LAB to XYZ color space
 */
export function labToXyz(lab: LAB): { x: number; y: number; z: number } {
  const y = (lab.l + 16) / 116;
  const x = lab.a / 500 + y;
  const z = y - lab.b / 200;

  return {
    x: labToXyzHelper(x) * REF_X,
    y: labToXyzHelper(y) * REF_Y,
    z: labToXyzHelper(z) * REF_Z,
  };
}

// =====================================================
// Direct RGB <-> LAB Conversions
// =====================================================

/**
 * Convert RGB to LAB color space
 */
export function rgbToLab(rgb: RGB): LAB {
  return xyzToLab(rgbToXyz(rgb));
}

/**
 * Convert LAB to RGB color space
 */
export function labToRgb(lab: LAB): RGB {
  return xyzToRgb(labToXyz(lab));
}

// =====================================================
// HSL/HSV Conversions
// =====================================================

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255),
  };
}

/**
 * Convert RGB to HSV
 */
export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * Convert HSV to RGB
 */
export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r: number, g: number, b: number;

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
    default: r = 0; g = 0; b = 0;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Convert RGB to hex string
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert hex string to RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculate color distance in LAB space (Delta E CIE76)
 */
export function colorDistance(color1: RGB, color2: RGB): number {
  const lab1 = rgbToLab(color1);
  const lab2 = rgbToLab(color2);

  const deltaL = lab1.l - lab2.l;
  const deltaA = lab1.a - lab2.a;
  const deltaB = lab1.b - lab2.b;

  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * Calculate color luminance
 */
export function getLuminance(rgb: RGB): number {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: RGB, color2: RGB): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Blend two colors
 */
export function blendColors(color1: RGB, color2: RGB, ratio: number): RGB {
  const r = ratio;
  const inv = 1 - r;
  return {
    r: Math.round(color1.r * inv + color2.r * r),
    g: Math.round(color1.g * inv + color2.g * r),
    b: Math.round(color1.b * inv + color2.b * r),
  };
}

/**
 * Get complementary color
 */
export function getComplementary(rgb: RGB): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.h = (hsl.h + 180) % 360;
  return hslToRgb(hsl);
}

/**
 * Get analogous colors
 */
export function getAnalogous(rgb: RGB, angle: number = 30): [RGB, RGB] {
  const hsl = rgbToHsl(rgb);
  const hsl1 = { ...hsl, h: (hsl.h + angle) % 360 };
  const hsl2 = { ...hsl, h: (hsl.h - angle + 360) % 360 };
  return [hslToRgb(hsl1), hslToRgb(hsl2)];
}

/**
 * Get triadic colors
 */
export function getTriadic(rgb: RGB): [RGB, RGB] {
  const hsl = rgbToHsl(rgb);
  const hsl1 = { ...hsl, h: (hsl.h + 120) % 360 };
  const hsl2 = { ...hsl, h: (hsl.h + 240) % 360 };
  return [hslToRgb(hsl1), hslToRgb(hsl2)];
}

// =====================================================
// Batch Processing
// =====================================================

/**
 * Convert image data to LAB values (for color transfer)
 */
export function imageDataToLab(imageData: Uint8ClampedArray): Float32Array[] {
  const pixelCount = imageData.length / 4;
  const lChannel = new Float32Array(pixelCount);
  const aChannel = new Float32Array(pixelCount);
  const bChannel = new Float32Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const lab = rgbToLab({
      r: imageData[idx],
      g: imageData[idx + 1],
      b: imageData[idx + 2],
    });
    lChannel[i] = lab.l;
    aChannel[i] = lab.a;
    bChannel[i] = lab.b;
  }

  return [lChannel, aChannel, bChannel];
}

/**
 * Convert LAB channels back to image data
 */
export function labToImageData(
  lChannel: Float32Array,
  aChannel: Float32Array,
  bChannel: Float32Array,
  alphaChannel: Uint8ClampedArray
): Uint8ClampedArray {
  const pixelCount = lChannel.length;
  const result = new Uint8ClampedArray(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const rgb = labToRgb({
      l: lChannel[i],
      a: aChannel[i],
      b: bChannel[i],
    });
    const idx = i * 4;
    result[idx] = rgb.r;
    result[idx + 1] = rgb.g;
    result[idx + 2] = rgb.b;
    result[idx + 3] = alphaChannel[idx + 3];
  }

  return result;
}

/**
 * Calculate statistics for LAB channels (mean, std)
 */
export function calculateLabStats(channels: Float32Array[]): {
  mean: [number, number, number];
  std: [number, number, number];
} {
  const stats = channels.map(channel => {
    const n = channel.length;
    let sum = 0;
    let sumSq = 0;

    for (let i = 0; i < n; i++) {
      sum += channel[i];
      sumSq += channel[i] * channel[i];
    }

    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    const std = Math.sqrt(Math.max(0, variance));

    return { mean, std };
  });

  return {
    mean: [stats[0].mean, stats[1].mean, stats[2].mean],
    std: [stats[0].std, stats[1].std, stats[2].std],
  };
}
