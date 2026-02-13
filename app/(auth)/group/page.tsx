import { generateMeta } from "@/lib/utils";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Header from "./component/header";

export async function generateMetadata() {
  return generateMeta({
    title: "Group Admin Dashboard",
    description:
      "A group dashboard is an admin panel that visualizes key group data such as income, expenses, cash flow, budget, and profit. Built with shadcn/ui, Tailwind CSS, Next.js.",
    canonical: "/group"
  });
}

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
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
        <Header />
  );
}
