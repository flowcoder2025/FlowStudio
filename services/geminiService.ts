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

/**
 * Generate multiple image variations (4 images)
 */
export const generateImageVariations = async (
  request: GenerationRequest,
  creditType: CreditType = 'auto'
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
        refImages: request.refImages, // COMPOSITE mode: multi-image array
        logoImage: request.logoImage,
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

    return data.images || [];
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
};

/**
 * Extract text from image (OCR functionality)
 * Note: This feature may need a separate endpoint in the future
 */
export const extractTextFromImage = async (imageBase64: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: "Extract all legible text from this image section. Return only the plain text found, preserving line breaks. If no text is found, return 'No text found'.",
        sourceImage: imageBase64,
        mode: 'EXTRACT_TEXT', // Special mode for text extraction
      }),
    });

    if (!response.ok) {
      throw new Error('텍스트 추출에 실패했습니다.');
    }

    const data = await response.json();

    // For text extraction, the response text is in the first "image" field
    return data.text || "텍스트 추출 중 오류가 발생했습니다.";
  } catch (error) {
    console.error('Text extraction error:', error);
    return "텍스트 추출 중 오류가 발생했습니다.";
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
  } else {
    // Edit mode & General Detail Edit Mode
    finalPrompt = `Edit the provided image section. Instruction: ${prompt}. Maintain the highest possible resolution and sharpness, especially for text and fine details. Ensure seamless blending with the surrounding edges.`;
  }

  return finalPrompt;
}
