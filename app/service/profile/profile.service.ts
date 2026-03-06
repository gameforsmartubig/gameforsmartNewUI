"use server";

import { createClient } from "@/lib/supabase-server";

export interface Profile {
  fullName: string;
  username: string;
  avatar: string;
  followers: number;
  following: number;
  friends: number;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  username: string;
  birthDate: string;
  grade: string;
  organization: string;
  phone: string;
  gender: string;
  nickname: string;
}

export interface AddressInfo {
  country: string;
  state: string;
  city: string;
}

export interface ProfileData {
  id: string;
  profile: Profile;
  personal: PersonalInfo;
  address: AddressInfo;
}

export async function getProfileData(): Promise<ProfileData> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const defaultResult: ProfileData = {
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
      grade: "",
      organization: "",
      phone: "",
      gender: "",
      nickname: ""
    },
    address: {
      country: "-",
      state: "-",
      city: "-"
    }
  };

  if (!user) return defaultResult;

  // Fetch Profile and Address Location resolving using foreign keys
  // Assuming foreign relations: countries(id), states(id), cities(id)
  const { data: profileData, error } = await supabase
    .from("profiles")
    .select(
      `
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
      countries (name),
      states (name),
      cities (name)
    `
    )
    .eq("auth_user_id", user.id)
    .single();

  if (error || !profileData) {
    console.error("Error fetching profile:", error);
    return defaultResult;
  }

  // Fetch friendships
  const currentUserId = profileData.id;
  const { data: followingList } = await supabase
    .from("friendships")
    .select("addressee_id")
    .eq("requester_id", currentUserId);

  const { data: followersList } = await supabase
    .from("friendships")
    .select("requester_id")
    .eq("addressee_id", currentUserId);

  const followingIds = followingList?.map((f: any) => f.addressee_id) || [];
  const followerIds = followersList?.map((f: any) => f.requester_id) || [];

  // Calculate Friends (Mutuals)
  const friendsCount = followingIds.filter((id) => followerIds.includes(id)).length;

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
      grade: profileData.grade || "",
      organization: profileData.organization || "",
      phone: profileData.phone || "",
      gender: profileData.gender || "",
      nickname: profileData.nickname || ""
    },
    address: {
      country: (profileData.countries as any)?.name || "-",
      state: (profileData.states as any)?.name || "-",
      city: (profileData.cities as any)?.name || "-"
    }
  };
}
