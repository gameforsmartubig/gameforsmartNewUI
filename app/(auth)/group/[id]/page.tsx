import { createClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import GroupDetail from "./component/detail";

export const revalidate = 0; // Disable caching to ensure fresh membership data

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user (Auth User)
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/group/${id}`);
  }

  // Get User Profile to get the XID (profile.id) which is used in group members
  // The 'user.id' is UUID, but 'profile.id' is XID (based on user feedback and auth-context logic)
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!userProfile) {
    // If no profile found, user cannot be a member (or invalid state), redirect
    redirect("/group");
  }

  const currentUserXid = (userProfile as any).id;

  const { data: group, error } = await supabase.from("groups").select("*").eq("id", id).single();

  if (error || !group) {
    return <div>Group not found or error loading group.</div>;
  }

  // Fetch profiles for members
  const members = Array.isArray((group as any).members) ? (group as any).members : [];

  const memberIds = members
    .map((m: any) => {
      if (!m) return null;
      // Handle both object format and potential string format
      // Expecting this to be the XID (profile.id)
      return typeof m === "string" ? m : m.user_id || m.id;
    })
    .filter((id: any) => typeof id === "string" && id.length > 0);

  // Check if current user is a member using XID
  const isMember = memberIds.includes(currentUserXid);

  if (!isMember) {
    redirect("/group");
  }

  let profiles: any[] = [];
  if (memberIds.length > 0) {
    const res = await supabase
      .from("profiles")
      .select("id, fullname, nickname, username, avatar_url")
      .in("id", memberIds);
    if (res.data) profiles = res.data;
  }

  // Map members with profile data
  const detailedMembers = members.map((m: any) => {
    const memberId = typeof m === "string" ? m : m.user_id || m.id;
    const profile = profiles.find((p: any) => p.id === memberId);

    // Determine raw role
    let rawRole = "MEMBER";
    if (typeof m !== "string" && m.role) rawRole = m.role;

    return {
      id: memberId,
      name: profile?.fullname || profile?.nickname || "Unknown User",
      username: profile?.username ? `@${profile.username}` : "@unknown",
      role: rawRole,
      avatar: profile?.avatar_url
    };
  });

  return <GroupDetail group={group} members={detailedMembers} />;
}
