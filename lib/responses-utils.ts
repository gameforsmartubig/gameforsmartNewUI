// ====================================================================
// File: lib/responses-utils.ts
// Description: Helper functions for handling optimized responses structure
// ====================================================================

export interface LegacyResponse {
  id: string;
  participant_id?: string; // Made optional for simplified structure
  session_id?: string; // Made optional for simplified structure
  question_id: string;
  answer_id: string | null;
  // Removed timing fields since they're no longer used
}

export interface OptimizedAnswer {
  id: string;
  question_id: string;
  answer_id: string | null;
  // Removed timing fields since they're no longer used
}

export interface OptimizedParticipantResponses {
  participant: string;
  answers: OptimizedAnswer[];
}

export type ResponsesData = LegacyResponse[] | OptimizedParticipantResponses[];

/**
 * Check if responses data is using the new optimized structure
 */
export function isOptimizedStructure(
  responses: any[]
): responses is OptimizedParticipantResponses[] {
  if (!responses || responses.length === 0) return false;

  // Check if first item has 'participant' and 'answers' properties
  const firstItem = responses[0];
  return (
    typeof firstItem === "object" &&
    "participant" in firstItem &&
    "answers" in firstItem &&
    Array.isArray(firstItem.answers)
  );
}

/**
 * Convert optimized structure to legacy flat array for backward compatibility
 */
export function optimizedToLegacy(
  optimizedResponses: OptimizedParticipantResponses[],
  sessionId?: string
): LegacyResponse[] {
  const legacyResponses: LegacyResponse[] = [];

  optimizedResponses.forEach((participantGroup) => {
    participantGroup.answers.forEach((answer) => {
      legacyResponses.push({
        id: answer.id,
        participant_id: participantGroup.participant,
        session_id: sessionId,
        question_id: answer.question_id,
        answer_id: answer.answer_id,
      });
    });
  });

  return legacyResponses;
}

/**
 * Convert legacy flat array to optimized structure
 */
export function legacyToOptimized(
  legacyResponses: LegacyResponse[]
): OptimizedParticipantResponses[] {
  const participantMap = new Map<string, OptimizedAnswer[]>();

  legacyResponses.forEach((response) => {
    const participantId = response.participant_id || "";

    if (!participantMap.has(participantId)) {
      participantMap.set(participantId, []);
    }

    participantMap.get(participantId)!.push({
      id: response.id,
      question_id: response.question_id,
      answer_id: response.answer_id,
    });
  });

  const optimizedResponses: OptimizedParticipantResponses[] = [];
  participantMap.forEach((answers, participantId) => {
    optimizedResponses.push({
      participant: participantId,
      answers: answers,
    });
  });

  return optimizedResponses;
}

/**
 * Get all responses as flat array regardless of structure
 */
export function getAllResponses(
  responses: ResponsesData,
  sessionId?: string
): LegacyResponse[] {
  if (!responses || responses.length === 0) return [];

  if (isOptimizedStructure(responses)) {
    return optimizedToLegacy(responses, sessionId || "");
  } else {
    return responses as LegacyResponse[];
  }
}

/**
 * Get responses for a specific participant
 */
export function getParticipantResponses(
  responses: ResponsesData,
  participantId: string,
  sessionId?: string
): LegacyResponse[] {
  if (!responses || responses.length === 0) return [];

  if (isOptimizedStructure(responses)) {
    const participantGroup = responses.find(
      (group) => group.participant === participantId
    );
    if (!participantGroup) return [];

    return participantGroup.answers.map((answer) => ({
      id: answer.id,
      participant_id: participantId,
      session_id: sessionId || "",
      question_id: answer.question_id,
      answer_id: answer.answer_id,
    }));
  } else {
    return (responses as LegacyResponse[]).filter(
      (r) => r.participant_id === participantId
    );
  }
}

/**
 * Add or update a response in the optimized structure
 */
export function addOrUpdateResponse(
  responses: ResponsesData,
  sessionId: string,
  response: LegacyResponse
): OptimizedParticipantResponses[] {
  let optimizedResponses: OptimizedParticipantResponses[];

  // Convert to optimized structure if needed
  if (isOptimizedStructure(responses)) {
    optimizedResponses = [...responses];
  } else {
    optimizedResponses = legacyToOptimized(responses as LegacyResponse[]);
  }

  // Find or create participant group
  let participantGroup = optimizedResponses.find(
    (group) => group.participant === response.participant_id
  );

  if (!participantGroup) {
    participantGroup = {
      participant: response.participant_id || "",
      answers: [],
    };
    optimizedResponses.push(participantGroup);
  }

  // Find existing answer or add new one
  const existingAnswerIndex = participantGroup.answers.findIndex(
    (answer) => answer.id === response.id
  );

  const optimizedAnswer: OptimizedAnswer = {
    id: response.id,
    question_id: response.question_id,
    answer_id: response.answer_id,
  };

  if (existingAnswerIndex >= 0) {
    // Update existing answer
    participantGroup.answers[existingAnswerIndex] = optimizedAnswer;
  } else {
    // Add new answer
    participantGroup.answers.push(optimizedAnswer);
  }

  return optimizedResponses;
}

/**
 * Remove a response from the optimized structure
 */
export function removeResponse(
  responses: ResponsesData,
  sessionId: string,
  responseId: string
): OptimizedParticipantResponses[] {
  let optimizedResponses: OptimizedParticipantResponses[];

  // Convert to optimized structure if needed
  if (isOptimizedStructure(responses)) {
    optimizedResponses = [...responses];
  } else {
    optimizedResponses = legacyToOptimized(responses as LegacyResponse[]);
  }

  // Remove the response
  optimizedResponses.forEach((participantGroup) => {
    participantGroup.answers = participantGroup.answers.filter(
      (answer) => answer.id !== responseId
    );
  });

  // Remove empty participant groups
  optimizedResponses = optimizedResponses.filter(
    (group) => group.answers.length > 0
  );

  return optimizedResponses;
}

/**
 * Get response statistics
 */
export function getResponseStats(responses: ResponsesData) {
  const allResponses = getAllResponses(responses);

  const participantCount = new Set(allResponses.map((r) => r.participant_id))
    .size;
  const totalResponses = allResponses.length;
  const answeredResponses = allResponses.filter(
    (r) => r.answer_id !== null
  ).length;

  return {
    participantCount,
    totalResponses,
    answeredResponses,
    unansweredResponses: totalResponses - answeredResponses,
  };
}

/**
 * Debug function to log structure information
 */
export function debugResponsesStructure(
  responses: ResponsesData,
  label: string = "Responses"
) {
  if (!responses || responses.length === 0) {
    console.log(`${label}: Empty or null`);
    return;
  }

  const isOptimized = isOptimizedStructure(responses);
  const stats = getResponseStats(responses);

  console.log(`${label} Structure:`, {
    isOptimized,
    structure: isOptimized
      ? "Optimized (grouped by participant)"
      : "Legacy (flat array)",
    ...stats,
    sampleData: responses[0],
  });
}
