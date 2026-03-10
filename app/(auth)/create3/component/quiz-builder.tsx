"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { SelectMethod } from "./select-method"
import { QuizDetail } from "./quiz-detail"
import { CreateQuiz } from "./create-quiz"
import { Preview } from "./preview"

export type QuizMethod = "ai" | "excel" | "manual"

export function QuizBuilder() {

  const [tab, setTab] = useState("method")
  const [method, setMethod] = useState<QuizMethod | null>(null)

  return (
    <Tabs value={tab} onValueChange={setTab}>

      <TabsList className="grid grid-cols-4 w-full mb-8">

        <TabsTrigger value="method">Select Method</TabsTrigger>
        <TabsTrigger value="detail">Quiz Detail</TabsTrigger>
        <TabsTrigger value="create">Create Quiz</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>

      </TabsList>

      <TabsContent value="method">
        <SelectMethod
          onSelect={(m: QuizMethod) => {
            setMethod(m)
            setTab("detail")
          }}
        />
      </TabsContent>

      <TabsContent value="detail">
        <QuizDetail
          method={method}
          next={() => setTab("create")}
          prev={() => setTab("method")}
        />
      </TabsContent>

      <TabsContent value="create">
        <CreateQuiz
          next={() => setTab("preview")}
          prev={() => setTab("detail")}
        />
      </TabsContent>

      <TabsContent value="preview">
        <Preview prev={() => setTab("create")} />
      </TabsContent>

    </Tabs>
  )
}