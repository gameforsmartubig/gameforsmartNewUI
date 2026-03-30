import { generateMeta } from "@/lib/utils";
import { Friends } from "./component/friends";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
  return generateMeta({
    title: "Friend",
    description:
      "A friend dashboard is an admin panel that visualizes key friend data such as income, expenses, cash flow, budget, and profit. Built with shadcn/ui, Tailwind CSS, Next.js.",
    canonical: "/friend"
  });
}

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/friend");
  }

  // Get profile id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex w-full items-center justify-between sm:w-auto">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Friend</h1>
        </div>
      </div>
      <Friends currentUserId={(profile as any).id} />
    </div>
  );
}
