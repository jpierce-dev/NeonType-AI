import { GoogleGenAI } from "@google/genai";
import { Difficulty } from "../types";

// Fallback texts in case API fails or key is missing
const FALLBACK_TEXTS = {
  [Difficulty.NOVICE]: "the quick brown fox jumps over the lazy dog simple words are easy to type and good for practice",
  [Difficulty.INTERMEDIATE]: "Practice makes perfect. Typing is a skill that improves with time and consistent effort. Keep your hands relaxed.",
  [Difficulty.ADVANCED]: "The concept of quantum entanglement implies that particles can share a state even when separated by vast distances, challenging classical physics.",
  [Difficulty.MASTER]: "function debounce(func, wait) { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }"
};

export const fetchPracticeText = async (difficulty: Difficulty): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("No API Key found, using fallback text.");
    return FALLBACK_TEXTS[difficulty];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    let prompt = "";
    switch (difficulty) {
      case Difficulty.NOVICE:
        prompt = "Generate 30 simple, common English words in lowercase, separated by spaces. No punctuation.";
        break;
      case Difficulty.INTERMEDIATE:
        prompt = "Generate 3 sentences of moderate difficulty with standard punctuation. About 40 words total.";
        break;
      case Difficulty.ADVANCED:
        prompt = "Generate a complex paragraph about science, technology, or history. Use advanced vocabulary and varied punctuation. About 60 words.";
        break;
      case Difficulty.MASTER:
        prompt = "Generate a snippet of text that includes technical jargon, numbers, symbols, and mixed case letters. It can be pseudo-code or a technical definition. About 50 words.";
        break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.8,
      }
    });

    const text = response.text?.trim();
    if (!text) throw new Error("Empty response from AI");
    
    // Cleanup potential markdown code blocks if the model adds them
    return text.replace(/```/g, '').trim();

  } catch (error) {
    console.error("Gemini API Error:", error);
    return FALLBACK_TEXTS[difficulty];
  }
};