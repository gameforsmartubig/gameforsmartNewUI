import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Navigator({
  questions,
  currentIndex,
  setCurrentIndex,
  addQuestion
}: any) {

  return (
    <Card>

      <CardHeader className="flex flex-row justify-between">
        <span className="font-semibold">Question Navigator</span>

        <Button size="sm" onClick={addQuestion}>
          <Plus className="w-4 h-4"/>
        </Button>

      </CardHeader>

      <CardContent>

        <div className="flex gap-2 flex-wrap">

          {questions.map((q: any, index: number) => (

            <button
              key={q.id}
              onClick={() => setCurrentIndex(index)}
              className={`w-10 h-10 rounded-md font-medium
              ${
                index === currentIndex
                  ? "bg-indigo-500 text-white"
                  : "border"
              }`}
            >
              {q.id}
            </button>

          ))}

        </div>

      </CardContent>

    </Card>
  )
}