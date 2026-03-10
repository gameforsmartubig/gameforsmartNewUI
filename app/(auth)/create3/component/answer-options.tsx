"use client"

import { RadioGroup } from "@/components/ui/radio-group"
import { RadioGroupItem } from "@/components/ui/radio-group"

export default function AnswerOptions({
  question,
  updateQuestion,
}: any) {

  const getOptionLabel = (index: number) =>
    String.fromCharCode(65 + index)

  const updateAnswer = (index: number, answer: string) => {
    const newAnswers = [...question.answers]
    newAnswers[index].answer = answer

    updateQuestion({
      ...question,
      answers: newAnswers,
    })
  }

  const setCorrectAnswer = (value: string) => {
    updateQuestion({
      ...question,
      correct: value,
    })
  }

  return (
    <div className="mt-6">

      <p className="font-medium mb-4">Answer Options</p>

      <RadioGroup
        value={question.correct}
        onValueChange={setCorrectAnswer}
        className="space-y-3"
      >

        {question.answers.map((ans: any, index: number) => {

          const label = getOptionLabel(index)

          return (

          <div
            key={ans.id}
            className="flex items-center gap-3 border rounded-lg p-3"
          >

            {/* RADIO */}
            <RadioGroupItem value={ans.id} id={`answer-${ans.id}`} />

            <span className="font-medium w-6">
                {label}
              </span>

            {/* INPUT ANSWER */}
            <input
              className="flex-1 outline-none bg-transparent"
              value={ans.answer}
              placeholder="Enter answer"
              onChange={(e) =>
                updateAnswer(index, e.target.value)
              }
            />

          </div>

        )})}

      </RadioGroup>

    </div>
  )
}