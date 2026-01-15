/**
 * Gemini Service - Server API Client
 * Calls /api/generate endpoint instead of direct Gemini API access
 *
 * Security: API keys are stored encrypted on server, not in localStorage
 */

import { GenerationRequest, AppMode } from "@/types";
import type { CreditType } from "@/components/CreditSelector";

/**
 * Generate a preview image (single variation)
 */
export const generatePreview = async (
  request: GenerationRequest,
  creditType: CreditType = 'auto'
): Promise<string | null> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: buildPrompt(request),
        sourceImage: request.image,
        refImage: request.refImage,
        refImages: request.refImages, // COMPOSITE mode: multi-image array
        logoImage: request.logoImage,
        maskImage: request.maskImage, // DETAIL_EDIT mode: mask overlay image
        category: request.category?.label,
        style: request.style?.label,
        aspectRatio: request.aspectRatio || '1:1',
        mode: request.mode,
        creditType,
      }),
    });

    if (!response.ok) {
      let errorMessage = '이미지 생성에 실패했습니다.';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // JSON 파싱 실패 시 텍스트로 읽기 (413 등의 경우)
        try {
          const textError = await response.text();
          errorMessage = textError || `서버 오류 (${response.status})`;
        } catch {
          errorMessage = `서버 오류 (${response.status})`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Return first image for preview
    return data.images?.[0] || null;
  } catch (error) {
    console.error('Preview generation error:', error);
    throw error;
  }
};

export const generateImageVariations = async (
  request: GenerationRequest,
  creditType: CreditType = 'auto',
  imageCount: number = 1
): Promise<string[]> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: buildPrompt(request),
        sourceImage: request.image,
        refImage: request.refImage,
        refImages: request.refImages,
        logoImage: request.logoImage,
        maskImage: request.maskImage,
        category: request.category?.label,
        style: request.style?.label,
        aspectRatio: request.aspectRatio || '1:1',
        mode: request.mode,
        imageCount,
        creditType,
      }),
    });

    if (!response.ok) {
      let errorMessage = '이미지 생성에 실패했습니다.';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // JSON 파싱 실패 시 텍스트로 읽기 (413 등의 경우)
        try {
          const textError = await response.text();
          errorMessage = textError || `서버 오류 (${response.status})`;
        } catch {
          errorMessage = `서버 오류 (${response.status})`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    return data.images || [];
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
};

/**
 * Extract text from image (OCR functionality)
 * Uses dedicated /api/extract-text endpoint with Gemini 2.0 Flash
 */
export const extractTextFromImage = async (imageBase64: string): Promise<string> => {
  try {
    const response = await fetch('/api/extract-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '텍스트 추출에 실패했습니다.');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '텍스트 추출에 실패했습니다.');
    }

    return data.text || '';
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error; // 에러를 상위로 전파하여 UI에서 처리
  }
};

/**
 * Upscale image to 4K resolution
 * Calls /api/upscale endpoint
 */
export const upscaleImage = async (imageBase64: string): Promise<string | null> => {
  try {
    const response = await fetch('/api/upscale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '업스케일링에 실패했습니다.');
    }

    const data = await response.json();
    return data.image || null;
  } catch (error) {
    console.error('Upscale error:', error);
    throw error;
  }
};

/**
 * Build comprehensive prompt based on request parameters
 */
function buildPrompt(request: GenerationRequest): string {
  const { prompt, category, style, mode } = request;

  let finalPrompt = "";

  if (mode === AppMode.CREATE) {
    finalPrompt = `Create a high-quality image based on this description: ${prompt}. `;
    if (category) {
      finalPrompt += `Context: This image is for ${category.label} (${category.description}). `;
    }
    if (style) {
      finalPrompt += `Style details: ${style.promptModifier}. `;
    }
    finalPrompt += "Ensure the subject is well-lit and clearly visible.";
  } else if (mode === AppMode.POSTER) {
    finalPrompt = `Design a professional advertisement poster. `;
    finalPrompt += `The Main Subject is the provided first image (Product). `;

    if (request.logoImage) {
      finalPrompt += `Integrate the provided Logo (second image) naturally into the composition (e.g., top corner or bottom center). Do not distort the logo. `;
    }

    finalPrompt += `Poster Theme/Context: ${prompt}. `;

    if (category) {
      finalPrompt += `Theme Category: ${category.label}. `;
    }
    if (style) {
      finalPrompt += `Visual Style: ${style.promptModifier}. `;
    }

    finalPrompt += "Layout should include clear space for text overlay (typography friendly). High visual hierarchy, commercial quality, eye-catching design.";
  } else if (mode === AppMode.DETAIL_PAGE) {
    finalPrompt = `Create a high-resolution vertical mobile product detail page section (Aspect Ratio 9:16). Description: ${prompt}. `;
    if (category) {
      finalPrompt += `Category: ${category.label}. `;
    }
    if (style) {
      finalPrompt += `Design Style: ${style.promptModifier}. `;
    }
    if (request.layout) {
      finalPrompt += `Layout Structure: ${request.layout.promptModifier} `;
    }
    if (request.refImage) {
      finalPrompt += "STYLE REFERENCE: Use the provided second image as a strict Style Reference. Mimic its colors, fonts, layout vibe, and lighting, but use the Main Product image for the content. ";
    }
    finalPrompt += "The image must be suitable for a continuous scrolling web page. Focus on high-quality visuals and clean layout. Maintain visual consistency with previous sections if implied.";
  } else if (mode === AppMode.COMPOSITE) {
    // Multi-image composition/staging mode
    const imageCount = request.refImages?.length || 0;
    finalPrompt = `You are given ${imageCount} material images. COMPOSE and ARRANGE them into a single cohesive image. `;
    finalPrompt += `User instruction: ${prompt}. `;

    if (category) {
      finalPrompt += `Composition Theme: ${category.label}. `;
    }
    if (style) {
      finalPrompt += `Visual Style: ${style.promptModifier}. `;
    }

    finalPrompt += "Create a professional, photorealistic composition where all objects blend naturally together. ";
    finalPrompt += "Pay attention to lighting consistency, shadows, perspective, and scale. ";
    finalPrompt += "The final image should look like a single, professionally shot photograph.";
  } else if (mode === AppMode.DETAIL_EDIT && request.refImage) {
    // Logic for Image Replacement
    finalPrompt = `Edit the provided target image. REPLACE the main subject or area in the center with the content of the reference image. Instruction: ${prompt}. Ensure the replaced object blends naturally with the lighting, shadows, and perspective of the original background. High quality composition.`;
  } else if (mode === AppMode.EDIT && request.refImage) {
    // Edit mode with Reference Image: Color/Style Transfer
    // Key: PIXEL-PERFECT preservation of shape, wrinkles, and texture
    finalPrompt = `[PRECISE COLOR TRANSFER - PRESERVE EVERY DETAIL]

=== ABSOLUTE REQUIREMENTS ===
This is a COLOR-ONLY transformation. The output must be structurally IDENTICAL to the input.

TASK: ${prompt}

=== WHAT MUST BE PRESERVED (DO NOT CHANGE) ===
1. SILHOUETTE & SHAPE: Every edge, outline, and contour must match exactly
2. WRINKLES & FOLDS: Every crease, fold line, and wrinkle pattern must be in the exact same position
3. FABRIC TEXTURE: The weave pattern, surface bumps, and material characteristics must remain identical
4. SHADOWS & HIGHLIGHTS: Keep the exact same light/dark areas that define the 3D form
5. MICRO-DETAILS: Stitching lines, seams, buttons, zippers - all in identical positions

=== WHAT TO CHANGE ===
ONLY the HUE and SATURATION values. Think of it like applying a color filter in Photoshop.
- Extract the color palette from the reference image
- Apply those colors to the INPUT image
- The luminosity/brightness pattern must stay the same

=== TECHNICAL APPROACH ===
Imagine converting the original image to grayscale, then colorizing it with the reference colors.
- The grayscale "skeleton" (all the wrinkles, folds, shadows) stays 100% unchanged
- Only the color information is replaced

=== FORBIDDEN ===
❌ Smoothing or altering any wrinkle
❌ Changing the direction or depth of any fold
❌ Modifying fabric draping or how cloth hangs
❌ Adjusting any shadow or highlight position
❌ Regenerating or "improving" any texture detail
❌ Changing garment fit, shape, or proportions

=== QUALITY CHECK ===
If you overlay the output on the input, the only difference should be color.
Every wrinkle, every fold, every shadow must align perfectly.

The result should be indistinguishable from the original except for the color change.`;
  } else {
    // Edit mode & General Detail Edit Mode
    finalPrompt = `Edit the provided image section. Instruction: ${prompt}. Maintain the highest possible resolution and sharpness, especially for text and fine details. Ensure seamless blending with the surrounding edges.`;
  }

  return finalPrompt;
}
