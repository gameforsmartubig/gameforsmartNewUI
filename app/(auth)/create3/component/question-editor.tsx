import { Textarea } from "@/components/ui/textarea"
import AnswerOptions from "./answer-options"

export default function QuestionEditor({
  question,
  updateQuestion,
  total,
  index
}: any) {

  const updateText = (text: string) => {
    updateQuestion({
      ...question,
      text
    })
  }

  return (
    <div className="border rounded-lg p-6">

      <div className="mb-4">

        <h2 className="text-xl font-semibold">
          Question Editor
        </h2>

        <p className="text-sm text-muted-foreground">
          Editing Question {index + 1} of {total}
        </p>

      </div>

      <Textarea
        placeholder="Enter your question here..."
        value={question.text}
        onChange={(e) => updateText(e.target.value)}
      />

      <AnswerOptions
        question={question}
        updateQuestion={updateQuestion}
      />

    </div>
  )
}