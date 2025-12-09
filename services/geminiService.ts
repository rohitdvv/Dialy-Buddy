import { GoogleGenAI, Type } from "@google/genai";
import { JournalData, NutritionData, Recommendation, ChatMessage } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const NUTRITION_MODEL = 'gemini-2.5-flash';
const JOURNAL_MODEL = 'gemini-2.5-flash';
const REASONING_MODEL = 'gemini-2.5-flash'; // Using Flash for speed/cost, Pro for depth if needed
const CHAT_MODEL = 'gemini-2.5-flash';

// --- Nutrition Analysis ---
// Returns data without timestamp, as timestamp is generated upon saving
export const analyzeFoodImage = async (base64Image: string, mimeType: string): Promise<Omit<NutritionData, 'timestamp'>> => {
  try {
    const response = await ai.models.generateContent({
      model: NUTRITION_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: "Analyze this food image. Estimate calories and macronutrients. Rate healthiness from 0-100. Provide a brief analysis."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            healthScore: { type: Type.NUMBER },
            analysis: { type: Type.STRING },
          },
          required: ["foodName", "calories", "protein", "carbs", "fat", "healthScore", "analysis"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Omit<NutritionData, 'timestamp'>;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Error analyzing food:", error);
    throw error;
  }
};

// --- Journal/Voice Analysis ---
export const analyzeJournalEntry = async (text: string, audioBase64?: string): Promise<JournalData> => {
  try {
    const parts: any[] = [];
    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: "audio/mp3", // Assuming recorded blob is convertible to mp3/wav
          data: audioBase64
        }
      });
      parts.push({ text: "Listen to this audio diary and analyze the speaker's emotional state." });
    } else {
      parts.push({ text: `Analyze this journal entry: "${text}"` });
    }

    const response = await ai.models.generateContent({
      model: JOURNAL_MODEL,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING },
            stressLevel: { type: Type.NUMBER, description: "1 to 10 scale" },
            sentimentScore: { type: Type.NUMBER, description: "-1.0 (negative) to 1.0 (positive)" },
            keyTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          },
          required: ["mood", "stressLevel", "sentimentScore", "keyTopics", "summary"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as JournalData;
    }
    throw new Error("No response from Gemini");
  } catch (error) {
    console.error("Error analyzing journal:", error);
    throw error;
  }
};

// --- Holistic Wellness Report ---
export const generateWellnessRecommendations = async (
  nutrition: NutritionData[],
  journal: JournalData[],
  activity: any
): Promise<{ recommendations: Recommendation[], wellnessScore: number }> => {
  try {
    const context = {
      nutritionHistory: nutrition,
      emotionalHistory: journal,
      activityLog: activity
    };

    const prompt = `
      Analyze the following health data for a user.
      Detect anomalies (e.g., high stress + poor sleep, bad diet + low activity).
      Generate 4 actionable recommendations and a daily wellness score (0-100).
      
      Data: ${JSON.stringify(context)}
    `;

    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            wellnessScore: { type: Type.NUMBER },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, enum: ["DIET", "FITNESS", "STRESS", "SLEEP"] },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Failed to generate recommendations");

  } catch (error) {
    console.error("Error generating report:", error);
    // Return fallback if API fails
    return {
      recommendations: [{
        category: 'STRESS',
        title: 'System Offline',
        description: 'Unable to generate personalized insights at this moment.',
        priority: 'HIGH'
      }],
      wellnessScore: 50
    };
  }
};

// --- Chat Companion ---
export const getChatResponse = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  try {
    // Format history for the model
    // We limit history to last 20 messages to keep context window manageable
    const recentHistory = history.slice(-20).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // Add new message
    const chatSession = ai.chats.create({
      model: CHAT_MODEL,
      config: {
        systemInstruction: "You are HealthGuard, a compassionate, friendly, and knowledgeable AI wellness companion. You talk to the user like a supportive friend. You have expertise in nutrition, sleep, stress management, and fitness. Keep responses concise, encouraging, and empathetic. Do not diagnose medical conditions; always advise seeing a doctor for serious issues."
      },
      history: recentHistory
    });

    // Fix: sendMessage takes an object with a 'message' property
    const result = await chatSession.sendMessage({ message: newMessage });
    
    // Fix: result.text property contains the string response (not result.response.text())
    return result.text || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Error in chat:", error);
    return "I'm having a little trouble connecting right now. Can we try again in a moment?";
  }
};