export interface AnswerOption {
  id: string
  answer: string
}

export interface Question {
  id: number
  question: string
  answers: AnswerOption[]
  correct: string
}