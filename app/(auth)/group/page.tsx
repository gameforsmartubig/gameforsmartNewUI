import { generateMeta } from "@/lib/utils";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Header from "./component/header";

export async function generateMetadata() {
  return generateMeta({
    title: "Group",
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
    .single<{ id: string }>();

  if (!profile) {
    return <div>Profile not found</div>;
  }

  // Fetch all groups with creator details
  const { data: allGroups, error } = await supabase.from("groups").select(`
      *,
      creator:creator_id (
        fullname,
        nickname,
        username,
        avatar_url,
        city:cities (name),
        state:states (name)
      )
    `);

  if (error) {
    console.error("Error fetching groups:", error);
  }

  const discoverGroups: any[] = [];
  const myGroups: any[] = [];

  if (allGroups) {
    allGroups.forEach((group: any) => {
      const members = Array.isArray(group.members) ? group.members : [];
      // Check if user is member (assuming structure { user_id: ... } or { id: ... })
      // If members is just array of strings (IDs), handle that too.
      const isMember = members.some((m: any) => {
        if (typeof m === "string") return m === profile.id;
        return m.user_id === profile.id || m.id === profile.id;
      });

      const status = group.settings?.status;

      if (isMember) {
        myGroups.push(group);
      } else {
        // Discover: public or private, and NOT member
        if (status === "public" || status === "private") {
          discoverGroups.push(group);
        }
      }
    });
  }

  return <Header discoverGroups={discoverGroups} myGroups={myGroups} />;
}
