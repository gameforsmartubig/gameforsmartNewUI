import { notFound } from "next/navigation";
import { PublicProfileView } from "./component/public-profile-view";
import { getPublicProfileData } from "../services/profile.service";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
  return generateMeta({
    title: "View Profile",
    description:
      "View someone else's profile.",
    canonical: "/profile/[slug]"
  });
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPublicProfileData(slug);

  if (!data.found) notFound();

  return (
    <div className="container mx-auto py-10">
      <PublicProfileView data={data} />
    </div>
  );
}
