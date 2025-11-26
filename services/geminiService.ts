/**
 * Gemini Service - Server API Client
 * Calls /api/generate endpoint instead of direct Gemini API access
 *
 * Security: API keys are stored encrypted on server, not in localStorage
 */

import { GenerationRequest, AppMode } from "@/types";

/**
 * Generate a preview image (single variation)
 */
export const generatePreview = async (request: GenerationRequest): Promise<string | null> => {
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
        category: request.category?.label,
        style: request.style?.label,
        aspectRatio: request.aspectRatio || '1:1',
        mode: request.mode,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '이미지 생성에 실패했습니다.');
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
export const generateImageVariations = async (request: GenerationRequest): Promise<string[]> => {
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
        category: request.category?.label,
        style: request.style?.label,
        aspectRatio: request.aspectRatio || '1:1',
        mode: request.mode,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '이미지 생성에 실패했습니다.');
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
  } else if (mode === AppMode.DETAIL_PAGE) {
    finalPrompt = `Create a high-resolution vertical mobile product detail page section (Aspect Ratio 9:16). Description: ${prompt}. `;
    if (category) {
      finalPrompt += `Category: ${category.label}. `;
    }
    if (style) {
      finalPrompt += `Design Style: ${style.promptModifier}. `;
    }
    finalPrompt += "The image must be suitable for a continuous scrolling web page. Focus on high-quality visuals and clean layout. Maintain visual consistency with previous sections if implied.";
  } else if (mode === AppMode.DETAIL_EDIT && request.refImage) {
    // Logic for Image Replacement
    finalPrompt = `Edit the provided target image. REPLACE the main subject or area in the center with the content of the reference image. Instruction: ${prompt}. Ensure the replaced object blends naturally with the lighting, shadows, and perspective of the original background. High quality composition.`;
  } else {
    // Edit mode & General Detail Edit Mode
    finalPrompt = `Edit the provided image section. Instruction: ${prompt}. Maintain the highest possible resolution and sharpness, especially for text and fine details. Ensure seamless blending with the surrounding edges.`;
  }

  return finalPrompt;
}
