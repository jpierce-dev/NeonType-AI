import { GoogleGenAI } from "@google/genai";
import { Difficulty } from "../types";

// Fallback texts in case API fails or key is missing
const FALLBACK_TEXTS = {
  [Difficulty.NOVICE]: [
    "the quick brown fox jumps over the lazy dog simple words are easy to type and good for practice",
    "ocean waves crash against the sandy shore as seagulls cry in the bright morning sun rays",
    "fresh coffee aroma fills the small kitchen while morning light streams through the window glass"
  ],
  [Difficulty.INTERMEDIATE]: [
    "Practice makes perfect. Typing is a skill that improves with time and consistent effort. Keep your hands relaxed.",
    "The journey of a thousand miles begins with a single step. Focus on accuracy before you try to increase your speed.",
    "Sustainable living is about making small changes that have a big impact on our environment over time."
  ],
  [Difficulty.ADVANCED]: [
    "The concept of quantum entanglement implies that particles can share a state even when separated by vast distances, challenging classical physics.",
    "Architectural masterpieces often reflect the cultural values and technological advancements of the era in which they were constructed.",
    "Digital nomadism has transformed the traditional workplace, allowing people to work from anywhere in the world with an internet connection."
  ],
  [Difficulty.MASTER]: [
    "function debounce(func, wait) { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }",
    "const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min; // Returns a random integer between min and max",
    "docker run -d --name my-container -p 8080:80 nginx:latest # Run a detached nginx container mapping port 8080 to 80"
  ]
};

const getRandomFallback = (difficulty: Difficulty) => {
  const texts = FALLBACK_TEXTS[difficulty];
  return texts[Math.floor(Math.random() * texts.length)];
};

export const fetchPracticeText = async (difficulty: Difficulty): Promise<string> => {
  // Use VITE_API_KEY for local dev, or process.env.API_KEY injected via Vite define in production
  const apiKey = (import.meta as any).env?.VITE_API_KEY || (typeof process !== 'undefined' ? process.env?.API_KEY : undefined);

  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    console.warn("No API Key found or invalid, using fallback text.");
    return getRandomFallback(difficulty);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const topics = [
      "space exploration", "mediterranean cooking", "modern architecture", "digital nomad life",
      "marine biology", "ancient civilizations", "quantum computing", "jazz history",
      "sustainable living", "urban gardening", "the future of AI", "extreme sports",
      "micro-adventures", "minimalist design", "the art of storytelling"
    ];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    let prompt = "";
    switch (difficulty) {
      case Difficulty.NOVICE:
        prompt = `Generate 30 simple, common English words about ${randomTopic} in lowercase, separated by spaces. No punctuation. Avoid starting with common words like 'the' if possible.`;
        break;
      case Difficulty.INTERMEDIATE:
        prompt = `Generate 3 diverse, interesting sentences about ${randomTopic} with standard punctuation. About 40 words total. Ensure the opening sentence is unique and not generic.`;
        break;
      case Difficulty.ADVANCED:
        prompt = `Generate a complex, high-quality paragraph about ${randomTopic}. Use advanced vocabulary, varied punctuation, and mixed sentence structures. About 60 words.`;
        break;
      case Difficulty.MASTER:
        prompt = `Generate a technical snippet or pseudo-code about ${randomTopic} that includes technical jargon, numbers, symbols, and mixed case letters. About 50 words.`;
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
    return getRandomFallback(difficulty);
  }
};