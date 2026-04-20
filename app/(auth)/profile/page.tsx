import { generateMeta } from "@/lib/utils";
import { ProfileView } from "./component/profile-view";
import { getProfileData } from "./services/profile.service";

export async function generateMetadata() {
  return generateMeta({
    title: "Profile",
    description: "Profile page",
    canonical: "/profile"
  });
}

export default async function Page() {
  const data = await getProfileData();

  return (
    <div className="container mx-auto py-10">
      <ProfileView data={data} />
    </div>
  );
}
