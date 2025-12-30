import { NextResponse } from "next/server";

// Tipe data untuk pertanyaan yang dihasilkan
type GeneratedQuestion = {
  question_text: string;
  image_url?: string;
  answers: {
    answer_text: string;
    is_correct: boolean;
    image_url?: string;
  }[];
};

// Tipe data untuk metadata quiz
type QuizMetadata = {
  title: string;
  description: string;
  category: string;
  language: string;
};

export async function POST(request: Request) {
  try {
    const { prompt, language, count = 5, generateMetadata = true, generateImages = false, model = "gemini-2.5-flash", randomizeCorrectAnswer = true } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Determine provider based on model
    let provider = "gemini";
    if (model.includes("x-ai/") || model.includes("openrouter") || 
        model.includes("deepseek/") || model.includes("zhipuai/") || 
        model.includes("z-ai/")) {
      provider = "openrouter";
    }

    // Check API keys based on provider
    if (provider === "openrouter") {
      const openrouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openrouterApiKey) {
        return NextResponse.json(
          { error: "API key OpenRouter tidak ditemukan. Silakan tambahkan OPENROUTER_API_KEY ke environment variables." },
          { status: 500 }
        );
      }
    } else {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
      return NextResponse.json(
        { error: "API key Gemini tidak ditemukan" },
        { status: 500 }
      );
      }
    }

    // Daftar model yang tersedia dengan konfigurasi masing-masing
    const availableModels = {
      // Gemini models (now primary choice)
      "gemini-2.5-flash": {
        maxTokens: 8192,
        description: "Gemini 2.5 Flash - Model terbaru dengan performa cepat dan akurat",
        provider: "gemini"
      },
      "gemini-2.0-flash": {
        maxTokens: 8192,
        description: "Gemini 2.0 Flash - Model cepat dengan performa baik untuk tugas umum",
        provider: "gemini"
      },
      "gemini-2.0-flash-lite": {
        maxTokens: 8192,
        description: "Gemini 2.0 Flash Lite - Model ringan untuk tugas sederhana",
        provider: "gemini"
      },
      "gemini-2.5-pro": {
        maxTokens: 8192,
        description: "Gemini 2.5 Pro - Model premium dengan akurasi terbaik",
        provider: "gemini"
      },
      
      // OpenRouter models (as backup)
      "z-ai/glm-4.5-air:free": {
        maxTokens: 8000,
        description: "GLM-4.5 Air gratis dari Zhipu AI - cepat, akurat, dan gratis",
        provider: "openrouter"
      },
      "deepseek/deepseek-chat": {
        maxTokens: 64000,
        description: "DeepSeek Chat - Model powerful untuk percakapan dan reasoning",
        provider: "openrouter"
      }
    };

    // Helper function untuk estimasi token
    const estimateTokens = (prompt: string, questionCount: number, generateMetadata: boolean): number => {
      // Estimasi kasar: 1 kata = 1.3 token
      const promptTokens = prompt.split(' ').length * 1.3;
      const systemPromptTokens = 200; // Prompt sistem base
      const questionTokens = questionCount * 150; // Setiap pertanyaan sekitar 150 token
      const metadataTokens = generateMetadata ? 100 : 0;
      
      return Math.ceil(promptTokens + systemPromptTokens + questionTokens + metadataTokens);
    };

    // Model fallback chain dengan priority
    const modelFallbackChain = [
      {
        id: "gemini-2.5-flash",
        provider: "gemini",
        maxTokens: 8192,
        priority: 1,
        cost: "free"
      },
      {
        id: "gemini-2.0-flash",
        provider: "gemini",
        maxTokens: 8192,
        priority: 2,
        cost: "free"
      },
      {
        id: "gemini-2.0-flash-lite",
        provider: "gemini",
        maxTokens: 8192,
        priority: 3,
        cost: "free"
      },
      {
        id: "gemini-2.5-pro",
        provider: "gemini",
        maxTokens: 8192,
        priority: 4,
        cost: "free"
      },
      {
        id: "z-ai/glm-4.5-air:free",
        provider: "openrouter",
        maxTokens: 8000,
        priority: 5,
        cost: "free"
      },
      {
        id: "deepseek/deepseek-chat",
        provider: "openrouter",
        maxTokens: 64000,
        priority: 6,
        cost: "paid"
      }
    ];

      const estimatedTokens = estimateTokens(prompt, count, generateMetadata);
      
    // Smart model selection dengan fallback chain
    let attemptResults: Array<{
      model: string;
      provider: string;
      error?: string;
      success?: boolean;
      attempt: number;
    }> = [];

    let selectedModels: typeof modelFallbackChain;

    if (model === "auto") {
      // Filter models yang bisa handle estimated tokens
      selectedModels = modelFallbackChain
        .filter(m => m.maxTokens >= estimatedTokens)
        .sort((a, b) => a.priority - b.priority);
    } else {
      // User memilih model spesifik, tapi masih ada fallback
      const specificModel = modelFallbackChain.find(m => m.id === model);
      if (specificModel && specificModel.maxTokens >= estimatedTokens) {
        selectedModels = [specificModel, ...modelFallbackChain.filter(m => 
          m.id !== model && m.maxTokens >= estimatedTokens
        ).sort((a, b) => a.priority - b.priority)];
      } else {
        selectedModels = modelFallbackChain
          .filter(m => m.maxTokens >= estimatedTokens)
          .sort((a, b) => a.priority - b.priority);
      }
      
    }
    
    if (selectedModels.length === 0) {
      return NextResponse.json(
        { 
          error: `Tidak ada model yang tersedia untuk menangani ${estimatedTokens} tokens. Kurangi jumlah pertanyaan atau perpendek prompt.`,
          estimatedTokens,
          maxAvailableTokens: Math.max(...modelFallbackChain.map(m => m.maxTokens))
        },
        { status: 400 }
      );
    }

    // Coba setiap model dalam fallback chain
    for (let i = 0; i < selectedModels.length; i++) {
      const modelToTry = selectedModels[i];
      
      // Trying model (removed console.log for performance)
      
      try {
        // Check if API key available for this provider
        if (modelToTry.provider === "openrouter") {
          if (!process.env.OPENROUTER_API_KEY) {
            // OPENROUTER_API_KEY not configured, skipping
            attemptResults.push({
              model: modelToTry.id,
              provider: modelToTry.provider,
              error: "OPENROUTER_API_KEY not configured",
              attempt: i + 1
            });
            continue;
          }
        } else if (modelToTry.provider === "gemini") {
          if (!process.env.GEMINI_API_KEY) {
            // GEMINI_API_KEY not configured, skipping
            attemptResults.push({
              model: modelToTry.id,
              provider: modelToTry.provider,
              error: "GEMINI_API_KEY not configured",
              attempt: i + 1
            });
            continue;
          }
        }

        // Generate system prompt (sama untuk semua model)
        const systemPrompt = generateSystemPrompt(prompt, count, generateMetadata, generateImages, language);

        // Try the model
        let result;
        if (modelToTry.provider === "openrouter") {
          result = await handleOpenRouterGeneration(systemPrompt, modelToTry.id, modelToTry.maxTokens);
        } else {
          result = await handleGeminiGeneration(systemPrompt, modelToTry.id, modelToTry.maxTokens);
        }

        if (result.error) {
          // Model failed (logged to attemptResults)
          attemptResults.push({
            model: modelToTry.id,
            provider: modelToTry.provider,
            error: result.error,
            attempt: i + 1
          });

          // Check if this is a rate limit/quota error - if so, try next model immediately
          if (result.status === 429 || 
              (result.error && (
                result.error.includes("quota") || 
                result.error.includes("rate limit") ||
                result.error.includes("Rate limit") ||
                result.error.includes("habis") ||
                result.error.includes("exceeded")
              ))) {
            // Rate/quota limit hit, trying next model
            continue;
          }
          
          // For other errors, also continue to next model
          // Other error, trying next model
          continue;
        }

        // Success! Process the result
        // Successfully used model
        
        const processedData = await processAIResponse(result, modelToTry.provider, generateMetadata, language, count, randomizeCorrectAnswer);
        
        if ('error' in processedData) {
          // Processing failed
          attemptResults.push({
            model: modelToTry.id,
            provider: modelToTry.provider,
            error: processedData.error,
            attempt: i + 1
          });
          continue;
        }

        // SUCCESS! Return the result
        attemptResults.push({
          model: modelToTry.id,
          provider: modelToTry.provider,
          success: true,
          attempt: i + 1
        });

        return NextResponse.json({
          questions: processedData.questions,
          metadata: processedData.metadata,
          debug: processedData.debug,
          modelUsed: modelToTry.id,
          provider: modelToTry.provider,
          estimatedTokens,
          attemptResults,
          fallbackUsed: i > 0, // True if we had to fallback
          totalAttempts: i + 1
        });

      } catch (error) {
        console.error(`❌ Unexpected error with ${modelToTry.id}:`, error);
        attemptResults.push({
          model: modelToTry.id,
          provider: modelToTry.provider,
          error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          attempt: i + 1
        });
        continue;
      }
    }

    // All models failed
    console.error("🚨 All AI models failed!");
      
      return NextResponse.json(
        { 
        error: "Semua model AI tidak tersedia saat ini. Silakan coba lagi nanti.",
        attemptResults,
          estimatedTokens,
        details: "Sistem telah mencoba semua model yang tersedia tetapi semuanya mengalami masalah.",
        suggestion: "Coba lagi dalam beberapa menit atau kurangi jumlah pertanyaan."
      },
      { status: 503 }
    );

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// Helper function to generate system prompt
function generateSystemPrompt(prompt: string, count: number, generateMetadata: boolean, generateImages: boolean, language: string): string {
  return `Kamu adalah pembuat quiz profesional yang ahli dalam membuat pertanyaan quiz yang menarik dan edukatif.
Buatkan TEPAT ${count} pertanyaan quiz dengan 4 pilihan jawaban untuk topik berikut: ${prompt}.

PENTING: Hasilkan TEPAT ${count} pertanyaan, tidak lebih dan tidak kurang.

VARIASI JAWABAN BENAR: Jangan selalu meletakkan jawaban benar di posisi pertama. Variasikan posisi jawaban yang benar:
- Beberapa pertanyaan: jawaban benar di posisi pertama
- Beberapa pertanyaan: jawaban benar di posisi kedua  
- Beberapa pertanyaan: jawaban benar di posisi ketiga
- Beberapa pertanyaan: jawaban benar di posisi keempat

${generateMetadata ? `Juga buatkan metadata quiz dengan:
- Judul: Maksimal 5 kata, langsung dan menarik
- Deskripsi: Maksimal 10 kata, singkat tapi jelas menggambarkan quiz
- Kategori: Pilih kategori yang paling sesuai` : ''}

${generateImages ? `PENTING: Untuk setiap pertanyaan, buatkan URL gambar placeholder yang relevan dengan pertanyaan. Gunakan format: https://picsum.photos/400/300?random=<nomor_acak> dimana <nomor_acak> adalah angka berbeda untuk setiap pertanyaan (contoh: 1, 2, 3, dst).` : ''}

Bahasa: ${language === 'id' ? 'Indonesia' : 'Inggris'}

PENTING: Kamu HARUS mengembalikan respons dalam format JSON yang valid dan lengkap. Jangan potong atau tinggalkan JSON yang tidak lengkap.
Pastikan semua kurung kurawal dan kurung siku ditutup dengan benar. Jangan tambahkan komentar atau teks lain di luar struktur JSON.

Format jawaban harus dalam JSON dengan struktur berikut:
{
  ${generateMetadata ? `"metadata": {
    "title": "Judul Quiz yang Menarik",
    "description": "Deskripsi singkat tentang quiz ini",
    "category": "general",
    "language": "${language}"
  },` : ''}
  "questions": [
    {
      "question_text": "Pertanyaan 1?",${generateImages ? `
      "image_url": "https://picsum.photos/400/300?random=1",` : ''}
      "answers": [
        { "answer_text": "Jawaban A", "is_correct": false },
        { "answer_text": "Jawaban B", "is_correct": true },
        { "answer_text": "Jawaban C", "is_correct": false },
        { "answer_text": "Jawaban D", "is_correct": false }
      ]
    }
  ]
}

Kategori yang tersedia adalah: general, science, math, history, geography, language, technology, sports, entertainment, business.

Pastikan hanya ada satu jawaban benar untuk setiap pertanyaan.
Jawaban harus masuk akal dan relevan dengan pertanyaan.
INGAT: Variasikan posisi jawaban yang benar, jangan selalu di posisi pertama!
Jangan tambahkan informasi atau teks lain selain JSON yang diminta.

PENTING: Jika jumlah pertanyaan yang diminta lebih dari 20, buat pertanyaan yang ringkas dan efisien untuk menghemat token. Pastikan semua pertanyaan tetap berkualitas baik dan sesuai dengan topik.`;
}

// Process AI response regardless of provider
async function processAIResponse(data: any, provider: string, generateMetadata: boolean, language: string, count: number, randomizeCorrectAnswer: boolean) {
  let parsedData: { metadata?: QuizMetadata, questions: GeneratedQuestion[] };
  
  try {
    // Get generated text based on provider
    let generatedText = "";
    if (provider === "openrouter") {
      generatedText = data.generatedText || "";
    } else {
      // Gemini response structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        return { error: "Format respons dari AI tidak valid" };
      }
      generatedText = data.candidates[0].content.parts[0].text.trim();
    }
    
    // AI response received (removed console.log for performance)

    // Parse JSON from response
    try {
      parsedData = JSON.parse(generatedText);
    } catch (directParseError) {
      // Direct JSON parse failed, trying to extract JSON
      
      // Try to extract JSON from text
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/g);
      
      if (jsonMatch && jsonMatch.length > 0) {
        let jsonString = jsonMatch.reduce((longest: string, current: string) => 
          current.length > longest.length ? current : longest, jsonMatch[0]);
        
        jsonString = jsonString.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
        
        try {
          parsedData = JSON.parse(jsonString);
        } catch (parseError) {
          console.error("Error parsing extracted JSON:", parseError);
          return { error: "Format respons JSON tidak valid" };
        }
      } else {
        console.error("No JSON found in response");
        return { error: "Tidak dapat menemukan JSON dalam respons" };
      }
    }
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return { error: "Error parsing AI response" };
  }

  // Validate and process metadata
  let metadata = undefined;
  if (generateMetadata && parsedData.metadata) {
    metadata = {
      title: parsedData.metadata.title || "",
      description: parsedData.metadata.description || "",
      category: parsedData.metadata.category || "general",
      language: parsedData.metadata.language || language,
    };
  }

  // Validate and process questions
  const questions = parsedData.questions || [];
  
  // Add explicit null check
  if (!Array.isArray(questions)) {
    return { error: "Questions data is not a valid array" };
  }

  // Detailed validation with error tracking
  const validationResults = {
    total: questions.length,
    invalid: [] as Array<{
      index: number;
      reason: string;
      question_preview: string;
    }>,
    reasons: {
      missing_question_text: 0,
      invalid_answers_array: 0,
      insufficient_answers: 0,
      no_correct_answer: 0,
      empty_answer_text: 0
    }
  };

  const validatedQuestions = questions
    .map((q, index) => ({ ...q, originalIndex: index }))
    .filter((q) => {
      let isValid = true;
      let reason = '';

      // Check question text
      if (!q.question_text || q.question_text.trim() === '') {
        isValid = false;
        reason = 'missing_question_text';
        validationResults.reasons.missing_question_text++;
      }
      // Check answers array
      else if (!Array.isArray(q.answers)) {
        isValid = false;
        reason = 'invalid_answers_array';
        validationResults.reasons.invalid_answers_array++;
      }
      // Check minimum answers
      else if (q.answers.length < 2) {
        isValid = false;
        reason = 'insufficient_answers';
        validationResults.reasons.insufficient_answers++;
      }
      // Check for correct answer
      else if (!q.answers.some(a => a.is_correct)) {
        isValid = false;
        reason = 'no_correct_answer';
        validationResults.reasons.no_correct_answer++;
      }
      // Check for empty answer texts
      else if (q.answers.some(a => !a.answer_text || a.answer_text.trim() === '')) {
        isValid = false;
        reason = 'empty_answer_text';
        validationResults.reasons.empty_answer_text++;
      }

      if (!isValid) {
        validationResults.invalid.push({
          index: q.originalIndex + 1,
          reason,
          question_preview: q.question_text ? q.question_text.substring(0, 50) + '...' : '[No question text]'
        });
      }

      return isValid;
    })
    .map(q => ({
      ...q,
      answers: q.answers.slice(0, 4).map((a, i) => ({
        answer_text: a.answer_text,
        is_correct: i === q.answers.findIndex(ans => ans.is_correct),
      })),
    }))
    .slice(0, count);

  // Randomize answer positions if requested
  const finalQuestions = randomizeAnswerPositions(validatedQuestions, randomizeCorrectAnswer);

  if (finalQuestions.length === 0) {
    return { error: "Tidak ada pertanyaan valid yang dihasilkan" };
  }

  // Question validation and processing completed
  // (removed detailed console logs for better performance)
  // Debug info is included in API response

  // Create comprehensive response with debug info
  const responseData = {
    questions: finalQuestions,
    metadata,
    debug: {
      generation_summary: {
        requested: count,
        ai_generated: questions.length,
        validated: validatedQuestions.length,
        final_returned: finalQuestions.length,
        filtered_out: validationResults.invalid.length
      },
      validation_issues: validationResults.invalid.length > 0 ? {
        total_invalid: validationResults.invalid.length,
        reasons: validationResults.reasons,
        invalid_questions: validationResults.invalid
      } : null,
      analysis: {
        success_rate: `${Math.round((finalQuestions.length / count) * 100)}%`,
        status: finalQuestions.length === count ? 'PERFECT' : 
               finalQuestions.length >= count * 0.9 ? 'GOOD' : 
               finalQuestions.length >= count * 0.7 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT'
      }
    }
  };

  return responseData;
}


// Handler untuk Gemini API
async function handleGeminiGeneration(systemPrompt: string, model: string, maxTokens: number) {
  const apiKey = process.env.GEMINI_API_KEY!;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: maxTokens,
          topP: 0.95,
          topK: 40
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = "Gagal menghasilkan pertanyaan dari AI";
      
      if (response.status === 401) {
        errorMessage = "API key Gemini tidak valid atau telah kedaluwarsa";
      } else if (response.status === 403) {
        errorMessage = "Akses ke API Gemini ditolak. Periksa konfigurasi API key";
      } else if (response.status === 429) {
        errorMessage = "Kuota API Gemini telah habis. Silakan coba lagi nanti";
      } else if (response.status >= 500) {
        errorMessage = "Server Gemini mengalami masalah. Silakan coba lagi nanti";
      } else if (data.error) {
        errorMessage = data.error.message || data.error || errorMessage;
      }
      
      return { error: errorMessage, status: response.status };
    }

    return data;
  } catch (error) {
    console.error("Error with Gemini:", error);
    return { error: "Failed to generate with Gemini", status: 500 };
  }
}

// Handler untuk OpenRouter API
async function handleOpenRouterGeneration(systemPrompt: string, model: string, maxTokens: number) {
  const apiKey = process.env.OPENROUTER_API_KEY!;
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": "GameForSmart Quiz Generator"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: systemPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
        top_p: 0.95,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = "Gagal menghasilkan pertanyaan dari AI";
      
      if (response.status === 401) {
        errorMessage = "API key OpenRouter tidak valid atau telah kedaluwarsa";
      } else if (response.status === 403) {
        errorMessage = "Akses ke API OpenRouter ditolak. Periksa konfigurasi API key";
      } else if (response.status === 429) {
        errorMessage = "Kuota API OpenRouter telah habis. Silakan coba lagi nanti";
      } else if (response.status >= 500) {
        errorMessage = "Server OpenRouter mengalami masalah. Silakan coba lagi nanti";
      } else if (data.error) {
        errorMessage = data.error.message || data.error || errorMessage;
      }
      
      return { error: errorMessage, status: response.status };
    }

    // Extract content from OpenRouter response
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      return { error: "Format respons dari OpenRouter tidak valid", status: 500 };
    }

    return { generatedText: data.choices[0].message.content.trim() };
  } catch (error) {
    console.error("Error with OpenRouter:", error);
    return { error: "Failed to generate with OpenRouter", status: 500 };
  }
}

// Helper function untuk mengacak array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function untuk mengacak posisi jawaban benar
function randomizeAnswerPositions(questions: GeneratedQuestion[], shouldRandomize: boolean): GeneratedQuestion[] {
  if (!shouldRandomize) {
    return questions;
  }

  return questions.map(question => {
    // Shuffle answers while keeping track of which one is correct
    const answersWithIndex = question.answers.map((answer, index) => ({
      ...answer,
      originalIndex: index
    }));
    
    const shuffledAnswers = shuffleArray(answersWithIndex);
    
    return {
      ...question,
      answers: shuffledAnswers.map(answer => ({
        answer_text: answer.answer_text,
        is_correct: answer.is_correct,
        image_url: answer.image_url
      }))
    };
  });
} 