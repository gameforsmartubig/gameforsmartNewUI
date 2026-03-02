import { generateMeta } from "@/lib/utils";
import EvaluationContent from "./component/main";

export async function generateMetadata() {
  return generateMeta({
    title: "Evaluation",
    description: "Track your quiz participation and hosting activity in one place.",
    canonical: "/evaluation"
  });
}

export default function Page() {
    return (
        <EvaluationContent />
    );
}