// ============================================================
// page.tsx — Quiz Detail (Server Component)
// Extracts params server-side and passes quizId to client component.
// ============================================================

import QuizDetail from "./components/Quizdetail";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
  return generateMeta({
    title: "Quiz Detail",
    description:
      "View quiz details, statistics, and questions.",
    canonical: "/detail/[id]"
  });
}

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <QuizDetail quizId={id} />;
}