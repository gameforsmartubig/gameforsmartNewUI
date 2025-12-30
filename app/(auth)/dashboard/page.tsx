import { generateMeta } from "@/lib/utils";
import quizzes from "@/data/quizzes.json";
import rawCategories from "@/data/categories.json";
import { TabsQuiz, SearchQuiz } from "./components/quiz";
import type { Category } from "./components/types";
import type { CategoryIconName } from "./components/quiz-icons";

export async function generateMetadata() {
  return generateMeta({
    title: "Admin Dashboard",
    description:
      "The admin dashboard template offers a sleek and efficient interface for monitoring important data and user interactions. Built with shadcn/ui.",
    canonical: "/dashboard"
  });
}

export default function Page() {
  const categories: Category[] = rawCategories.map((cat) => ({
    ...cat,
    icon: cat.icon as CategoryIconName
  }));
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex w-full items-center justify-between sm:w-auto">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Dashboard</h1>
        </div>
        <SearchQuiz categories={categories}/>
      </div>
      <TabsQuiz quizzes={quizzes} categories={categories}/>
    </div>
  );
}
