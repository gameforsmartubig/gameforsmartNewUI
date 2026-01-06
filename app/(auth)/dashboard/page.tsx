import { generateMeta, formatTimeAgo } from "@/lib/utils";
import rawCategories from "@/data/categories.json";
import { DashboardContent } from "./components/quiz";
import type { Category, Quiz } from "./components/types";
import type { CategoryIconName } from "./components/quiz-icons";
import { createClient } from "@/lib/supabase-server";

export async function generateMetadata() {
  return generateMeta({
    title: "Dashboard",
    description:
      "The admin dashboard template offers a sleek and efficient interface for monitoring important data and user interactions. Built with shadcn/ui.",
    canonical: "/dashboard"
  });
}

export default async function Page() {
  const supabase = await createClient();

  // 1. Get Current User & Profile
  const {
    data: { user }
  } = await supabase.auth.getUser();
  let currentProfileId = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    currentProfileId = profile?.id;
  }

  // 2. Fetch Quizzes (Base Data)
  const { data: quizzesData, error: quizzesError } = await supabase
    .from("quizzes")
    .select("*")
    .order("created_at", { ascending: false });

  if (quizzesError) {
    console.error("Error fetching quizzes:", quizzesError);
    return <div>Error loading quizzes. Please try again later.</div>;
  }

  // 3. Prepare IDs for batch fetching
  const creatorIds = quizzesData.map((q) => q.creator_id).filter(Boolean); // Filter nulls

  // 4. Fetch Related Data in Parallel
  const [profilesResult] = await Promise.all([
    // Fetch creators profiles
    supabase.from("profiles").select("id, username, avatar_url, auth_user_id").in("id", creatorIds)
  ]);

  const profilesData = profilesResult.data || [];

  // 5. Map Data
  // Map: CreatorID -> Profile
  const profileMap: Record<string, any> = {};
  profilesData.forEach((p: any) => {
    // Index by id because that's what quizzes.creator_id refers to
    profileMap[p.id] = p;
    // Also index by auth_user_id just in case needed elsewhere
    if (p.auth_user_id) profileMap[p.auth_user_id] = p;
  });

  // 6. Transform Final Data
  const allQuizzes: Quiz[] = (quizzesData || []).map((q: any) => {
    // Creator profile lookup
    const profile = profileMap[q.creator_id];

    // Questions count from JSONB column
    const questionsCount = Array.isArray(q.questions) ? q.questions.length : 0;

    // Check if favorited by current user
    // favorite column is JSONB array of profile IDs
    const favorites = Array.isArray(q.favorite) ? q.favorite : [];

    return {
      title: q.title,
      creator: profile?.username || "Unknown",
      creatorPicture: profile?.avatar_url || "/images/avatars/01.png",
      categoryId: (q.category || "general").toLowerCase(),
      questions: questionsCount,
      language: q.language || "English",
      played: q.played || 0,
      createdAt: formatTimeAgo(q.created_at, "short", "id"),
      // Internal metadata for filtering
      _raw: {
        isPublic: q.is_public,
        creatorId: q.creator_id,
        isFavorite: currentProfileId ? favorites.includes(currentProfileId) : false
      }
    };
  });

  // 7. Filter Quizzes
  const publicQuizzes = allQuizzes.filter((q) => q._raw?.isPublic === true);
  const myQuizzes = allQuizzes.filter(
    (q) => q._raw?.isPublic === false && q._raw?.creatorId === currentProfileId
  );
  const favoriteQuizzes = allQuizzes.filter((q) => q._raw?.isFavorite === true);

  const categories: Category[] = rawCategories.map((cat) => ({
    ...cat,
    icon: cat.icon as CategoryIconName
  }));

  return (
    <DashboardContent
      publicQuizzes={publicQuizzes}
      myQuizzes={myQuizzes}
      favoriteQuizzes={favoriteQuizzes}
      categories={categories}
    />
  );
}
