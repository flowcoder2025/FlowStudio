import { GoogleGenAI } from "@google/genai";
import { GenerationRequest, AppMode } from "@/types";

// Models
const PRO_MODEL = 'gemini-3-pro-image-preview';     // "Nano Banana Pro" - High quality for all tasks

const getAiClient = () => {
  // In Next.js client-side, get API key from localStorage
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set your API key in the Profile page.");
  }
  return new GoogleGenAI({ apiKey });
};

const prepareRequestParts = (request: GenerationRequest) => {
  const { prompt, image, refImage, category, style, mode } = request;

  // Construct a robust prompt
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
  } else if (mode === AppMode.DETAIL_EDIT && refImage) {
    // Logic for Image Replacement
    finalPrompt = `Edit the provided target image. REPLACE the main subject or area in the center with the content of the reference image. Instruction: ${prompt}. Ensure the replaced object blends naturally with the lighting, shadows, and perspective of the original background. High quality composition.`;
  } else {
    // Edit mode & General Detail Edit Mode
    finalPrompt = `Edit the provided image section. Instruction: ${prompt}. Maintain the highest possible resolution and sharpness, especially for text and fine details. Ensure seamless blending with the surrounding edges.`;
  }

  const parts: any[] = [{ text: finalPrompt }];

  if (image) {
    // Target Image (Cropped section or full image)
    const base64Data = image.split(',')[1] || image;
    const mimeType = image.includes('image/jpeg') ? 'image/jpeg' : 'image/png';

    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    });
  }

  if (refImage) {
    // Reference Image (Replacement source)
    const base64DataRef = refImage.split(',')[1] || refImage;
    const mimeTypeRef = refImage.includes('image/jpeg') ? 'image/jpeg' : 'image/png';

    parts.push({
      inlineData: {
        mimeType: mimeTypeRef,
        data: base64DataRef
      }
    });
  }

  return parts;
};

const generateSingleImageInternal = async (parts: any[], aspectRatio: string = "1:1", modelName: string): Promise<string | null> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return null;
  }
};

export const generatePreview = async (request: GenerationRequest): Promise<string | null> => {
  const parts = prepareRequestParts(request);
  // Always use PRO_MODEL, use the requested aspect ratio (e.g. calculated adaptive ratio)
  return generateSingleImageInternal(parts, request.aspectRatio || "1:1", PRO_MODEL);
};

export const generateImageVariations = async (request: GenerationRequest): Promise<string[]> => {
  const parts = prepareRequestParts(request);

  // Always use PRO_MODEL
  const model = PRO_MODEL;

  // Run 4 parallel requests
  const numberOfVariations = 4;
  const promises = Array.from({ length: numberOfVariations }, () => generateSingleImageInternal(parts, request.aspectRatio, model));

  const results = await Promise.all(promises);

  // Filter out failed generations
  return results.filter((res): res is string => res !== null);
};

export const extractTextFromImage = async (imageBase64: string): Promise<string> => {
  const ai = getAiClient();
  const base64Data = imageBase64.split(',')[1] || imageBase64;
  const mimeType = imageBase64.includes('image/jpeg') ? 'image/jpeg' : 'image/png';

  try {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: {
        parts: [
          {
            text: "Extract all legible text from this image section. Return only the plain text found, preserving line breaks. If no text is found, return 'No text found'."
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    console.error("Text Extraction Error:", error);
    return "텍스트 추출 중 오류가 발생했습니다.";
  }
};
