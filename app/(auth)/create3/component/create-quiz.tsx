"use client";

import { useState } from "react";
import Navigator from "./navigator";
import QuestionEditor from "./question-editor";
import { AnswerOption, Question } from "@/app/service/create/create.service";
import { Button } from "@/components/ui/button";

const createEmptyQuestion = (id: number): Question => ({
  id,
  question: "",
  correct: "",
  answers: [
    { id: "0", answer: "" },
    { id: "1", answer: "" },
    { id: "2", answer: "" },
    { id: "3", answer: "" }
  ]
});

export function CreateQuiz({ next, prev }: any) {
  const [questions, setQuestions] = useState<Question[]>([createEmptyQuestion(1)]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const addQuestion = () => {
    const newQuestion = createEmptyQuestion(questions.length + 1);

    setQuestions([...questions, newQuestion]);
    setCurrentIndex(questions.length);
  };

  const updateQuestion = (updated: Question) => {
    const newQuestions = [...questions];
    newQuestions[currentIndex] = updated;
    setQuestions(newQuestions);
  };
  console.log(questions)
  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <Navigator
            questions={questions}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            addQuestion={addQuestion}
          />
        </div>

        <div className="col-span-9">
          <QuestionEditor
            question={questions[currentIndex]}
            updateQuestion={updateQuestion}
            total={questions.length}
            index={currentIndex}
          />

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => setCurrentIndex(currentIndex - 1)}>
              Previous
            </Button>

            <Button variant="outline" onClick={() => setCurrentIndex(currentIndex + 1)}>
              Next Step
            </Button>
          </div>
        </div>

      </div>
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={prev}>
            Previous
          </Button>

          <Button variant="outline" onClick={next}>
            Next Step
          </Button>
        </div>
    </>
  );
}
