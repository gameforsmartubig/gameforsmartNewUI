import { generateMeta } from "@/lib/utils";
import EvaluationContent from "./component/evaluation-content";

export async function generateMetadata() {
  return generateMeta({
    title: "Evaluation",
    description: "Track your quiz participation in one place.",
    canonical: "/evaluation"
  });
}

export default function Page() {
  return <EvaluationContent />;
}
