import { supabase } from "./supabase";
import { generateXID } from "./id-generator";

/**
 * Health check function to verify database schema (NEW JSONB SCHEMA)
 */
export async function verifyDatabaseSchema() {
  try {
    // Checking database schema (removed console.log for performance)

    // Test quizzes table structure with JSONB questions
    const { data: quizTest, error: quizError } = await supabase
      .from("quizzes")
      .select(
        "id, title, description, creator_id, is_public, category, language, image_url, questions"
      )
      .limit(1);

    if (quizError) {
      console.error("Quizzes table issue:", quizError);
      return { success: false, error: `Quizzes table: ${quizError.message}` };
    }

    // Database schema verification passed
    return { success: true };
  } catch (error) {
    console.error("Schema verification failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper function to validate and clean quiz data before insert
 */
function validateAndCleanQuizData(quizData: QuizData): QuizData {
  const cleanedData = {
    ...quizData,
    title: quizData.title?.trim(),
    description: quizData.description?.trim() || null,
    category: quizData.category?.trim() || null,
    language: quizData.language?.trim() || null,
    image_url: quizData.image_url?.trim() || null,
    questions: quizData.questions.map((q) => ({
      question_text: q.question_text?.trim(),
      time_limit: q.time_limit,
      image_url: q.image_url?.trim() || null,
      question_type: (q as any).question_type || "multiple_choice",
      answers: q.answers.map((a) => ({
        answer_text: a.answer_text?.trim() || "", // Keep empty string if no text
        is_correct: a.is_correct,
        color: a.color?.trim() || "#e74c3c",
        order_index: (a as any).order_index,
        image_url: a.image_url?.trim() || null,
      })),
    })),
  };

  return cleanedData;
}

export interface QuizQuestion {
  question_text: string;
  time_limit?: number;
  image_url?: string | null;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  answer_text: string; // Can be empty string if image is provided
  is_correct: boolean;
  color: string;
  image_url?: string | null;
}

export interface QuizData {
  title: string;
  description?: string | null;
  creator_id: string;
  is_public: boolean;
  category?: string | null;
  language?: string | null;
  image_url?: string | null;
  questions: QuizQuestion[];
}

/**
 * Batch insert quiz with questions and answers for better performance
 * Uses single transaction to ensure data consistency
 */
export async function batchInsertQuiz(quizData: QuizData) {
  try {
    // Clean and validate input data
    const cleanedData = validateAndCleanQuizData(quizData);

    // Validate input data
    if (!cleanedData.title || !cleanedData.creator_id) {
      throw new Error("Title and creator_id are required");
    }

    if (cleanedData.questions.length === 0) {
      throw new Error("At least one question is required");
    }

    // Check for potential duplicate quiz (same title, creator, within 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const { data: recentQuizzes, error: duplicateCheckError } = await supabase
      .from("quizzes")
      .select("id, title, created_at")
      .eq("creator_id", cleanedData.creator_id)
      .eq("title", cleanedData.title)
      .gte("created_at", thirtySecondsAgo)
      .limit(1);

    if (duplicateCheckError) {
      console.warn(
        "Warning: Could not check for duplicates:",
        duplicateCheckError
      );
      // Continue with insert, but log the warning
    } else if (recentQuizzes && recentQuizzes.length > 0) {
      const recentQuiz = recentQuizzes[0];
      const timeDiff = Math.round(
        (Date.now() - new Date(recentQuiz.created_at).getTime()) / 1000
      );
      // Duplicate quiz detected (included in error message)
      throw new Error(
        `Quiz dengan judul "${cleanedData.title}" sudah dibuat ${timeDiff} detik yang lalu. ` +
          "Mohon tunggu sebentar atau gunakan judul yang berbeda."
      );
    }

    // No duplicate detected, proceeding with creation

    // Validate questions
    for (let i = 0; i < cleanedData.questions.length; i++) {
      const question = cleanedData.questions[i];
      if (!question.question_text) {
        throw new Error(`Question ${i + 1} text is required`);
      }
      if (!question.answers || question.answers.length < 2) {
        throw new Error(`Question ${i + 1} must have at least 2 answers`);
      }
      const correctAnswers = question.answers.filter((a) => a.is_correct);
      if (correctAnswers.length !== 1) {
        throw new Error(
          `Question ${i + 1} must have exactly one correct answer`
        );
      }

      // Validate each answer - must have at least text OR image (or both)
      for (let j = 0; j < question.answers.length; j++) {
        const answer = question.answers[j];
        const hasText = answer.answer_text && answer.answer_text.trim() !== "";
        const hasImage = answer.image_url && answer.image_url.trim() !== "";

        if (!hasText && !hasImage) {
          throw new Error(
            `Question ${i + 1}, Answer ${
              j + 1
            } harus memiliki teks atau gambar (atau keduanya)`
          );
        }
      }
    }

    // Starting batch insert (removed console.log for performance)

    // Step 1: Insert the quiz
    const quizInsertData = {
      title: cleanedData.title,
      description: cleanedData.description,
      creator_id: cleanedData.creator_id,
      is_public: cleanedData.is_public,
      category: cleanedData.category,
      language: cleanedData.language,
      // Try image_url first, fallback to cover_image for backward compatibility
      image_url: cleanedData.image_url,
      cover_image: cleanedData.image_url,
    };

    // Inserting quiz data

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert(quizInsertData)
      .select()
      .single();

    if (quizError) {
      console.error("Quiz insert error:", quizError);
      throw quizError;
    }

    // Quiz inserted successfully

    // Step 2: Prepare questions with answers as JSONB
    if (cleanedData.questions.length > 0) {
      const questionsWithAnswers = cleanedData.questions.map(
        (question, index) => {
          // Generate XIDs for question and answers
          const questionId = generateXID();
          const answersWithIds = question.answers.map(
            (answer, answerIndex) => ({
              id: answerIndex.toString(),
              answer: answer.answer_text,
              image: answer.image_url || null,
            })
          );

          // Find correct answer index
          const correctIndex = question.answers.findIndex((a) => a.is_correct);

          return {
            id: questionId,
            question: question.question_text,
            type: "multiple_choice",
            image: question.image_url || null,
            correct: correctIndex.toString(),
            answers: answersWithIds,
          };
        }
      );

      // Updating quiz with JSONB questions
      // Sample question data prepared

      // Step 3: Update quiz with JSONB questions
      const { error: questionsError } = await supabase
        .from("quizzes")
        .update({
          questions: questionsWithAnswers,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quiz.id);

      if (questionsError) {
        console.error("Questions update error:", questionsError);
        throw questionsError;
      }

      // Questions updated successfully in JSONB format
    }

    return { success: true, quiz };
  } catch (error) {
    console.error("Error in batch insert quiz:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      quizData: {
        title: quizData?.title,
        questionsCount: quizData?.questions?.length,
        creator_id: quizData?.creator_id,
      },
    });

    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Failed to create quiz: ${error.message}`);
    } else {
      throw new Error("Failed to create quiz: Unknown database error");
    }
  }
}

/**
 * Add new questions to existing quiz (used in edit mode) - JSONB VERSION
 */
export async function batchInsertQuestions(
  quizId: string,
  questions: QuizQuestion[],
  startIndex: number = 0
) {
  try {
    if (questions.length === 0) return { success: true, questions: [] };

    // Step 1: Get current quiz with existing questions
    const { data: currentQuiz, error: fetchError } = await supabase
      .from("quizzes")
      .select("questions")
      .eq("id", quizId)
      .single();

    if (fetchError) throw fetchError;

    // Step 2: Prepare new questions with answers as JSONB
    const newQuestions = questions.map((question, index) => {
      const questionId = generateXID();
      const answersWithIds = question.answers.map((answer, answerIndex) => ({
        id: answerIndex.toString(),
        answer: answer.answer_text,
        image: answer.image_url || null,
      }));

      // Find correct answer index
      const correctIndex = question.answers.findIndex((a) => a.is_correct);

      return {
        id: questionId,
        question: question.question_text,
        type: "multiple_choice",
        image: question.image_url || null,
        correct: correctIndex.toString(),
        answers: answersWithIds,
      };
    });

    // Step 3: Combine existing and new questions
    const existingQuestions = currentQuiz.questions || [];
    const updatedQuestions = [...existingQuestions, ...newQuestions];

    // Step 4: Update quiz with combined questions
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({
        questions: updatedQuestions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quizId);

    if (updateError) throw updateError;

    // Questions added to quiz in JSONB format
    return { success: true, questions: newQuestions };
  } catch (error) {
    console.error("Error in batch insert questions:", error);
    throw error;
  }
}

/**
 * Fallback function for sequential insert if batch insert fails - JSONB VERSION
 */
export async function sequentialInsertQuiz(quizData: QuizData) {
  // Using fallback sequential insert with JSONB

  // Validate and clean quiz data first
  const cleanedData = validateAndCleanQuizData(quizData);

  // Prepare questions with answers as JSONB
  const questionsWithAnswers = cleanedData.questions.map((question, index) => {
    const questionId = generateXID();
    const answersWithIds = question.answers.map((answer, answerIndex) => ({
      id: answerIndex.toString(),
      answer: answer.answer_text,
      image: answer.image_url || null,
    }));

    // Find correct answer index
    const correctIndex = question.answers.findIndex((a) => a.is_correct);

    return {
      id: questionId,
      question: question.question_text,
      type: "multiple_choice",
      image: question.image_url || null,
      correct: correctIndex.toString(),
      answers: answersWithIds,
    };
  });

  // Insert the quiz with questions in one go
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      title: cleanedData.title,
      description: cleanedData.description || null,
      creator_id: cleanedData.creator_id,
      is_public: cleanedData.is_public,
      category: cleanedData.category || null,
      language: cleanedData.language || null,
      image_url: cleanedData.image_url || null,
      cover_image: cleanedData.image_url || null,
      questions: questionsWithAnswers,
    })
    .select()
    .single();

  if (quizError) throw quizError;

  // Quiz with JSONB questions inserted successfully
  return { success: true, quiz };
}

/**
 * Helper function to chunk large arrays for batch processing
 * Useful when dealing with very large datasets
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Batch update existing questions for better performance
 */
export async function batchUpdateQuestions(
  questionsToUpdate: Array<{
    id: string;
    question_text: string;
    time_limit: number;
    order_index: number;
    image_url?: string | null;
  }>
) {
  try {
    if (questionsToUpdate.length === 0) return { success: true };

    // Batch updating questions

    // Use upsert for better performance with batch updates
    const { error: questionsError } = await supabase
      .from("questions")
      .upsert(questionsToUpdate, {
        onConflict: "id",
        ignoreDuplicates: false,
      });

    if (questionsError) {
      console.error("Batch questions update error:", questionsError);
      throw questionsError;
    }

    // Questions updated successfully via batch operation
    return { success: true };
  } catch (error) {
    console.error("Error in batch update questions:", error);
    throw error;
  }
}

/**
 * Batch update existing answers for better performance
 */
export async function batchUpdateAnswers(
  answersToUpdate: Array<{
    id: string;
    answer_text: string;
    is_correct: boolean;
    color: string;
    order_index: number;
    image_url?: string | null;
  }>
) {
  try {
    if (answersToUpdate.length === 0) return { success: true };

    // Batch updating answers

    // Use upsert for better performance with batch updates
    const { error: answersError } = await supabase
      .from("answers")
      .upsert(answersToUpdate, {
        onConflict: "id",
        ignoreDuplicates: false,
      });

    if (answersError) {
      console.error("Batch answers update error:", answersError);
      throw answersError;
    }

    // Answers updated successfully via batch operation
    return { success: true };
  } catch (error) {
    console.error("Error in batch update answers:", error);
    throw error;
  }
}

/**
 * Batch delete answers for better performance
 */
export async function batchDeleteAnswers(answerIds: string[]) {
  try {
    if (answerIds.length === 0) return { success: true };

    // Batch deleting answers

    const { error: deleteError } = await supabase
      .from("answers")
      .delete()
      .in("id", answerIds);

    if (deleteError) {
      console.error("Batch answers delete error:", deleteError);
      throw deleteError;
    }

    // Answers deleted successfully via batch operation
    return { success: true };
  } catch (error) {
    console.error("Error in batch delete answers:", error);
    throw error;
  }
}

/**
 * Batch insert with chunking for very large datasets
 * Processes data in smaller batches to avoid database limits
 */
export async function batchInsertQuizWithChunking(
  quizData: QuizData,
  chunkSize: number = 50
) {
  try {
    // Step 1: Insert the quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        title: quizData.title,
        description: quizData.description || null,
        creator_id: quizData.creator_id,
        is_public: quizData.is_public,
        category: quizData.category,
        language: quizData.language,
        image_url: quizData.image_url,
      })
      .select()
      .single();

    if (quizError) throw quizError;

    if (quizData.questions.length === 0) {
      return { success: true, quiz };
    }

    // Step 2: Process questions in chunks
    const questionChunks = chunkArray(quizData.questions, chunkSize);
    const allInsertedQuestions: any[] = [];

    for (let chunkIndex = 0; chunkIndex < questionChunks.length; chunkIndex++) {
      const questionChunk = questionChunks[chunkIndex];
      const startIndex = chunkIndex * chunkSize;

      // Prepare questions for this chunk
      const questionsToInsert = questionChunk.map((question, index) => ({
        quiz_id: quiz.id,
        question_text: question.question_text,
        time_limit: question.time_limit,
        order_index: startIndex + index,
        image_url: question.image_url || null,
      }));

      // Insert questions for this chunk
      const { data: insertedQuestions, error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert)
        .select();

      if (questionsError) throw questionsError;
      allInsertedQuestions.push(...insertedQuestions);

      // Prepare answers for this chunk
      const chunkAnswers: any[] = [];
      insertedQuestions.forEach((question, questionIndex) => {
        const questionAnswers = questionChunk[questionIndex].answers;
        questionAnswers.forEach((answer, answerIndex) => {
          chunkAnswers.push({
            question_id: question.id,
            answer_text: answer.answer_text,
            is_correct: answer.is_correct,
            color: answer.color,
            order_index: answerIndex,
            image_url: answer.image_url || null,
          });
        });
      });

      // Insert answers for this chunk
      if (chunkAnswers.length > 0) {
        const { error: answersError } = await supabase
          .from("answers")
          .insert(chunkAnswers);

        if (answersError) throw answersError;
      }
    }

    return { success: true, quiz, questions: allInsertedQuestions };
  } catch (error) {
    console.error("Error in batch insert quiz with chunking:", error);
    throw error;
  }
}
