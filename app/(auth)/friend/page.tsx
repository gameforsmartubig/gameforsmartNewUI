import { generateMeta } from "@/lib/utils";
import { SearchFriends, Friends } from "./component/friends";

export async function generateMetadata() {
  return generateMeta({
    title: "Friend Admin Dashboard",
    description:
      "A friend dashboard is an admin panel that visualizes key friend data such as income, expenses, cash flow, budget, and profit. Built with shadcn/ui, Tailwind CSS, Next.js.",
    canonical: "/friend"
  });
}

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex w-full items-center justify-between sm:w-auto">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Friend</h1>
        </div>
        <SearchFriends />
      </div>
      <Friends />
    </div>
  );
}
