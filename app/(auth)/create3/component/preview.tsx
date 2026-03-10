import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function Preview({ prev }: any) {

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold">
        Preview & Save
      </h2>

      <Card>
        <CardContent className="p-6 space-y-4">

          <h3 className="font-semibold">
            1. What does HTML stand for?
          </h3>

          <div className="grid grid-cols-2 gap-4">

            <Button variant="outline">
              HyperText Markup Language
            </Button>

            <Button variant="outline">
              HyperText Machine Language
            </Button>

            <Button variant="outline">
              HyperText Markdown Language
            </Button>

            <Button variant="outline">
              None of the above
            </Button>

          </div>

        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">

        <Button variant="outline" onClick={prev}>
          Back to Edit
        </Button>

        <Button>
          Save Quiz
        </Button>

      </div>

    </div>
  )
}