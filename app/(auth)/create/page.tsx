// ============================================================
// page.tsx  (Next.js App Router page entry point)
//
// Minimal entry – logic is in _hooks/useCreateQuiz.ts
// UI is in _components/CreateQuizLayout.tsx
// ============================================================

import { CreateQuizLayout } from "./component/CreateQuizLayout";

export default function CreateQuizPage() {
  return <CreateQuizLayout />;
}
