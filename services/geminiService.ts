
import { GoogleGenAI } from "@google/genai";
import { Category } from '../types';

// FIX: The API key must be obtained exclusively from `process.env.API_KEY` per coding guidelines.
// This removes the dependency on `import.meta.env` and resolves the TypeScript error.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY is not set. AI features will not work.");
}

// FIX: Conditionally initialize the AI client to prevent runtime errors when API_KEY is missing.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const suggestCategory = async (description: string, categories: Category[]): Promise<string | null> => {
  // FIX: Check if the `ai` instance was successfully initialized before using it.
  if (!ai) {
    throw new Error("Gemini API key is not configured.");
  }

  const categoryNames = categories.map(c => c.name);
  const prompt = `Based on the transaction description "${description}", suggest the best category from this list: [${categoryNames.join(', ')}]. Respond with only the name of the category.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // For faster response
      }
    });
    
    const suggestedCategoryName = response.text.trim();
    
    // Validate if the suggested category exists in our list
    const foundCategory = categories.find(c => c.name.toLowerCase() === suggestedCategoryName.toLowerCase());

    return foundCategory ? foundCategory.id : null;
  } catch (error) {
    console.error("Error suggesting category:", error);
    return null;
  }
};
