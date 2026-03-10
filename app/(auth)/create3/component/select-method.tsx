import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuizMethod } from "./quiz-builder"

export function SelectMethod({ onSelect }: { onSelect: (method: QuizMethod) => void }) {

  return (

    <div className="grid md:grid-cols-3 gap-6">

      <Card>
        <CardContent className="p-6 space-y-4">

          <h3 className="text-lg font-semibold">
            AI Generation
          </h3>

          <p className="text-sm text-muted-foreground">
            Generate quiz automatically with AI
          </p>

          <Button
            className="w-full"
            onClick={() => onSelect("ai")}
          >
            Select AI
          </Button>

        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">

          <h3 className="text-lg font-semibold">
            Import From Excel
          </h3>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => onSelect("excel")}
          >
            Upload Excel
          </Button>

        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">

          <h3 className="text-lg font-semibold">
            Create Manually
          </h3>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => onSelect("manual")}
          >
            Manual Build
          </Button>

        </CardContent>
      </Card>

    </div>

  )
}