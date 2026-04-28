import { generateMeta } from "@/lib/utils";
import HistoryTabs from "./components/history-tabs";
import { getQuizHistory } from "./services/history.service";

export async function generateMetadata() {
  return generateMeta({
    title: "History",
    description: "Track your quiz participation and hosting activity in one place.",
    canonical: "/history"
  });
}

export default async function QuizHistoryPage() {
  const data = await getQuizHistory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
      </div>

      <HistoryTabs data={data} />
    </div>
  );
}
