import { NextResponse } from "next/server";

// Daftar model AI yang tersedia
const availableModels = {
  // Gemini models - now available in UI
  gemini: {
    "gemini-2.5-flash": {
      maxTokens: 8192,
      description: "Gemini 2.5 Flash - Model terbaru dengan performa cepat dan akurat",
      recommended: true,
      provider: "gemini",
      cost: "free",
      contextLength: 1048576
    },
    "gemini-2.0-flash": {
      maxTokens: 8192,
      description: "Gemini 2.0 Flash - Model cepat dengan performa baik untuk tugas umum",
      recommended: true,
      provider: "gemini",
      cost: "free",
      contextLength: 1048576
    },
    "gemini-2.0-flash-lite": {
      maxTokens: 8192,
      description: "Gemini 2.0 Flash Lite - Model ringan untuk tugas sederhana dengan response cepat",
      recommended: false,
      provider: "gemini",
      cost: "free",
      contextLength: 1048576
    },
    "gemini-2.5-pro": {
      maxTokens: 8192,
      description: "Gemini 2.5 Pro - Model premium dengan kapasitas dan akurasi terbaik",
      recommended: false,
      provider: "gemini",
      cost: "free",
      contextLength: 2097152
    }
  },
  
  openrouter: {
    "z-ai/glm-4.5-air:free": {
      maxTokens: 8000,
      description: "GLM-4.5 Air gratis dari Zhipu AI melalui OpenRouter - cepat, akurat, dan gratis",
      recommended: false,
      provider: "openrouter",
      cost: "free",
      contextLength: 128000
    },
    "deepseek/deepseek-chat": {
      maxTokens: 64000,
      description: "DeepSeek Chat - Model powerful untuk percakapan dan reasoning dengan context window besar",
      recommended: false,
      provider: "openrouter",
      cost: "paid",
      contextLength: 64000
    }
  }
};

export async function GET() {
  try {
    return NextResponse.json({
      models: availableModels, // Now includes both Gemini and OpenRouter models
        default: "gemini-2.5-flash",
      recommendations: {
        "small_quiz": "gemini-2.0-flash-lite", // <= 10 pertanyaan
        "medium_quiz": "gemini-2.0-flash", // 11-25 pertanyaan  
        "large_quiz": "gemini-2.5-flash", // 26-50 pertanyaan
        "huge_quiz": "gemini-2.5-pro"   // > 50 pertanyaan
      },
      info: "Gunakan model Gemini untuk performa terbaik dengan API key terbaru"
    });
  } catch (error) {
    console.error("Error getting models:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar model" },
      { status: 500 }
    );
  }
}
