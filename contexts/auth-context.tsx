"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";

// OPTIMIZED: Centralized profile data - single source of truth
export interface ProfileData {
  id: string;
  auth_user_id: string;
  username: string;
  fullname: string | null;
  avatar_url: string | null;
  role: string | null;
  language: string | null;
  country_id: number | null;
  countries?: { iso2: string; name: string } | null;
  is_blocked: boolean;
  blocked_at: string | null;
  email: string | null;
  phone: string | null;
  favorite_quiz: { favorites: string[] } | null;
  notifications: any[] | null;
}

interface AuthContextType {
  user: User | null;
  profile: ProfileData | null;
  profileId: string | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    username: string,
    fullname: string,
    countryId?: number | null,
    stateId?: number | null,
    cityId?: number | null,
    phone?: string | null
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // OPTIMIZED: Fetch complete profile data in ONE query
  const fetchProfile = async (userId: string, authUser?: User) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          auth_user_id,
          username,
          fullname,
          avatar_url,
          role,
          language,
          country_id,
          countries (iso2, name),
          is_blocked,
          blocked_at,
          email,
          phone,
          favorite_quiz,
          notifications
        `
        )
        .eq("auth_user_id", userId)
        .single();

      if (!error && data) {
        let safeData = data as unknown as ProfileData;

        // "Following Gmail" Logic: If database profile is missing name/avatar OR has generic name, 
        // try to populate from auth user metadata (Google profile)
        if (authUser) {
          const googleName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.user_metadata?.custom_claims?.name;
          const googleAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || authUser.user_metadata?.custom_claims?.picture;

          // Check for generic names in DB
          const currentDbName = safeData.fullname?.toLowerCase().trim();
          const isGenericName = !currentDbName ||
            currentDbName === "user" ||
            currentDbName === "guest" ||
            currentDbName === "unknown" ||
            currentDbName === "member";

          if (googleName && isGenericName) {
            safeData.fullname = googleName;
          }

          if (googleAvatar && (!safeData.avatar_url || safeData.avatar_url === "/images/avatars/10.png")) {
            safeData.avatar_url = googleAvatar;
          }
        }

        // Store PROFILE ID (not auth_user_id) to localStorage as requested
        localStorage.setItem("user_id", safeData.id);

        setProfile(safeData);
        setProfileId(safeData.id);
      } else {
        // If profile doesn't exist yet but user is logged in, 
        // we might be in the middle of registration or it's a new OAuth user
        setProfile(null);
        setProfileId(null);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  // Function to refresh profile data
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id, user);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser);
      }

      setLoading(false);
      setInitialLoad(false);
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem("user_id");
        setProfile(null);
        setProfileId(null);
        setUser(null);
        setLoading(false);
      } else if (session?.user) {
        setUser(session.user);
        setLoading(true);
        await fetchProfile(session.user.id, session.user);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullname: string,
    countryId?: number | null,
    stateId?: number | null,
    cityId?: number | null,
    phone?: string | null
  ) => {
    console.log("🔵 Starting signUp process...");

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.error("❌ Auth signUp error:", error);
      throw error;
    }

    console.log("✅ Auth user created:", data.user?.id);

    if (data.user) {
      // Wait a bit to ensure auth user is committed to database
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create profile with all required fields
      // NOTE: Don't pass 'id' - the trigger will auto-generate XID
      // Pass 'auth_user_id' to link with auth.users table
      const profileData: any = {
        auth_user_id: data.user.id,
        username,
        email,
        fullname: fullname || null,
        country_id: countryId || null,
        state_id: stateId || null,
        city_id: cityId || null,
        phone: phone || null,
        avatar_url: null
      };

      console.log("🔵 Creating profile with data:", profileData);

      // Retry logic for profile creation (max 3 attempts)
      let attempts = 0;
      let insertedProfile = null;
      let profileError = null;

      while (attempts < 3) {
        attempts++;
        console.log(`🔄 Profile creation attempt ${attempts}/3`);

        const result = await supabase.from("profiles").insert(profileData).select();

        insertedProfile = result.data;
        profileError = result.error;

        if (!profileError) {
          console.log("✅ Profile created successfully:", insertedProfile);
          break;
        }

        console.warn(`⚠️ Attempt ${attempts} failed:`, profileError);

        // Wait before retry (exponential backoff)
        if (attempts < 3) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempts));
        }
      }

      if (profileError) {
        console.error("❌ Profile creation failed after 3 attempts:", profileError);
        throw new Error(`Failed to create profile: ${profileError.message || "Unknown error"}`);
      }
    } else {
      console.error("❌ No user data returned from signUp");
      throw new Error("No user data returned from signUp");
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear role cookie
    if (typeof document !== "undefined") {
      document.cookie = "role=; path=/; max-age=0; SameSite=Lax";
    }

    // Remove the force redirect - let the component handle navigation
    // window.location.href = "/"
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, profileId, loading, refreshProfile, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
