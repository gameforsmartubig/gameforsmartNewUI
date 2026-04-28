"use server";

import { createClient } from "@/lib/supabase-server";
import type {
  ProfileData,
  PublicProfileData,
  UpdateProfileState
} from "../types";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const DEFAULT_PROFILE_DATA: ProfileData = {
  id: "",
  profile: {
    fullName: "Anonymous",
    username: "unknown",
    avatar: "",
    followers: 0,
    following: 0,
    friends: 0
  },
  personal: {
    fullName: "",
    email: "",
    username: "",
    birthDate: "",
    isoBirthDate: "",
    grade: "",
    organization: "",
    phone: "",
    gender: "",
    nickname: ""
  },
  address: {
    country: "-",
    state: "-",
    city: "-",
    countryId: null,
    stateId: null,
    cityId: null
  }
};

async function getFriendshipCounts(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const [{ data: followingList }, { data: followersList }] = await Promise.all([
    supabase.from("friendships").select("addressee_id").eq("requester_id", userId),
    supabase.from("friendships").select("requester_id").eq("addressee_id", userId)
  ]);

  const followingIds = followingList?.map((f: any) => f.addressee_id) ?? [];
  const followerIds = followersList?.map((f: any) => f.requester_id) ?? [];
  const friendsCount = followingIds.filter((id) => followerIds.includes(id)).length;

  return { followingIds, followerIds, friendsCount };
}

// ─────────────────────────────────────────────
// Read
// ─────────────────────────────────────────────

/**
 * Ambil data profil milik user yang sedang login.
 */
export async function getProfileData(): Promise<ProfileData> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return DEFAULT_PROFILE_DATA;

  const { data: profileData, error } = await supabase
    .from("profiles")
    .select(`
      id,
      fullname,
      nickname,
      username,
      avatar_url,
      email,
      phone,
      birthdate,
      grade,
      organization,
      gender,
      country_id,
      state_id,
      city_id,
      countries (name),
      states (name),
      cities (name)
    `)
    .eq("auth_user_id", user.id)
    .single();

  if (error || !profileData) {
    console.error("Error fetching profile:", error);
    return DEFAULT_PROFILE_DATA;
  }

  const { followingIds, followerIds, friendsCount } = await getFriendshipCounts(
    profileData.id,
    supabase
  );

  return {
    id: profileData.id,
    profile: {
      fullName: profileData.fullname || "Anonymous User",
      username: profileData.username || "@user",
      avatar: profileData.avatar_url || "",
      followers: followerIds.length,
      following: followingIds.length,
      friends: friendsCount
    },
    personal: {
      fullName: profileData.fullname || "",
      email: profileData.email || user.email || "",
      username: profileData.username || "",
      birthDate: profileData.birthdate
        ? new Date(profileData.birthdate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })
        : "",
      isoBirthDate: profileData.birthdate || "",
      grade: profileData.grade || "",
      organization: profileData.organization || "",
      phone: profileData.phone || "",
      gender: profileData.gender || "",
      nickname: profileData.nickname || ""
    },
    address: {
      country: (profileData.countries as any)?.name || "-",
      state: (profileData.states as any)?.name || "-",
      city: (profileData.cities as any)?.name || "-",
      countryId: profileData.country_id || null,
      stateId: profileData.state_id || null,
      cityId: profileData.city_id || null
    }
  };
}

/**
 * Ambil data profil publik berdasarkan username (slug).
 */
export async function getPublicProfileData(slug: string): Promise<PublicProfileData> {
  const notFound: PublicProfileData = {
    id: "",
    found: false,
    profile: {
      fullName: "Not Found",
      username: slug,
      avatar: "",
      followers: 0,
      following: 0,
      friends: 0
    },
    nickname: "",
    fullName: "",
    username: slug,
    organization: "",
    gender: "",
    country: "-"
  };

  if (!slug) return notFound;

  const supabase = await createClient();

  const { data: profileData, error } = await supabase
    .from("profiles")
    .select(`
      id,
      fullname,
      nickname,
      username,
      avatar_url,
      organization,
      gender,
      country_id,
      countries (name)
    `)
    .ilike("username", slug)
    .single();

  if (error || !profileData) return notFound;

  const { followingIds, followerIds, friendsCount } = await getFriendshipCounts(
    profileData.id,
    supabase
  );

  return {
    id: profileData.id,
    found: true,
    profile: {
      fullName: profileData.fullname || "Anonymous User",
      username: profileData.username || slug,
      avatar: profileData.avatar_url || "",
      followers: followerIds.length,
      following: followingIds.length,
      friends: friendsCount
    },
    nickname: profileData.nickname || "",
    fullName: profileData.fullname || "",
    username: profileData.username || slug,
    organization: profileData.organization || "",
    gender: profileData.gender || "",
    country: (profileData.countries as any)?.name || "-"
  };
}

// ─────────────────────────────────────────────
// Update
// ─────────────────────────────────────────────

/**
 * Update data profil user (Server Action — dipanggil via useActionState).
 */
export async function updateProfileData(
  prevState: UpdateProfileState | null,
  formData: FormData
): Promise<UpdateProfileState> {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return { error: "Authentication required" };

    const updatePayload: any = {
      fullname:     formData.get("fullName") as string,
      nickname:     formData.get("nickname") as string,
      username:     formData.get("username") as string,
      phone:        formData.get("phone") as string,
      birthdate:    (formData.get("birthDate") as string) || null,
      grade:        formData.get("grade") as string,
      organization: formData.get("organization") as string,
      gender:       formData.get("gender") as string,
      updated_at:   new Date().toISOString()
    };

    const countryId = formData.get("countryId") as string;
    const stateId   = formData.get("stateId") as string;
    const cityId    = formData.get("cityId") as string;
    const avatarUrl = formData.get("avatarUrl") as string | null;

    if (countryId) updatePayload.country_id = parseInt(countryId);
    if (stateId)   updatePayload.state_id   = parseInt(stateId);
    if (cityId)    updatePayload.city_id     = parseInt(cityId);
    if (avatarUrl) updatePayload.avatar_url  = avatarUrl;

    const { error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("auth_user_id", user.id);

    if (error) return { error: error.message };

    return { success: true, message: "Profile updated successfully!" };
  } catch (error: any) {
    return { error: error.message || "Failed to update profile" };
  }
}
