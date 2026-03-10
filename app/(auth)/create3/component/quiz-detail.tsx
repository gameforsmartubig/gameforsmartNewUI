import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function QuizDetail({ method, next, prev }: any) {

  return (

    <div className="space-y-6">

      {method === "excel" && (

        <div className="space-y-4 border p-4 rounded-lg">

          <h3 className="font-semibold">
            Import Questions from Excel
          </h3>

          <Button variant="outline">
            Download Excel Template
          </Button>

          <Input type="file" />

        </div>

      )}

      {method === "ai" && (

        <div className="space-y-4 border p-4 rounded-lg">

          <h3 className="font-semibold">
            AI Quiz Generator
          </h3>

          <div>
            <label className="text-sm font-medium">
              Prompt
            </label>
            <Textarea placeholder="Create 10 multiple choice questions about HTML basics..." />
          </div>

          <div>
            <label className="text-sm font-medium">
              Number of Questions
            </label>
            <Input type="number" defaultValue={5} />
          </div>

        </div>

      )}

      <div>
        <label className="text-sm font-medium">
          Quiz Title
        </label>

        <Input placeholder="Enter quiz title" />
      </div>

      <div>
        <label className="text-sm font-medium">
          Description
        </label>

        <Textarea placeholder="Describe the quiz" />
      </div>

      <div className="grid grid-cols-2 gap-6">

        <Input placeholder="Category" />
        <Input placeholder="Language" />

      </div>

      <div className="flex justify-between pt-6">

        <Button variant="outline" onClick={prev}>
          Previous
        </Button>

        <Button onClick={next}>
          Next Step
        </Button>

      </div>

    </div>
  )
}