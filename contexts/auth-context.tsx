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
  nickname: string | null;
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
    nickname: string,
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
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          auth_user_id,
          username,
          fullname,
          nickname,
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
        // Type assertion needed because query result type inference might be truncated
        const safeData = data as unknown as ProfileData;

        // Store PROFILE ID (not auth_user_id) to localStorage as requested
        localStorage.setItem("user_id", safeData.id);

        setProfile(safeData);
        setProfileId(safeData.id);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  // Function to refresh profile data
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let currentUserId: string | null | undefined = undefined;

    // Get initial session
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id || null;
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);

        // SSO REDIRECT: Jika sudah login tapi ada di /login atau /register, lempar ke /callback
        const pathname = window.location.pathname;
        if (pathname === "/login" || pathname === "/register") {
          console.log('[SSO] User sudah login, mengalihkan dari halaman auth ke /callback...');
          window.location.href = "/callback";
        }
      }
      setLoading(false);
      setInitialLoad(false);
    };

    initSession();

    // Check if there is a session change (across subdomains)
    const checkSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const newUserId = user?.id || null;

        if (currentUserId !== undefined && newUserId !== currentUserId) {
          console.log("[AuthContext] Session change detected across tabs/subdomains! Reloading...");
          window.location.reload();
        }
      } catch (err) {
        console.error("[AuthContext] Error checking session:", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", checkSession);

    // Listen for auth changes in current tab
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (event === "SIGNED_IN" && currentUser) {
        fetchProfile(currentUser.id);
        checkSession();
      } else if (event === "SIGNED_OUT") {
        localStorage.removeItem("user_id"); // Clear from localStorage
        setUser(null);
        setProfile(null);
        setProfileId(null);
        checkSession();

        // FORCE REDIRECT: Jika sedang di dashboard/protected, tendang ke login
        if (typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          const isProtected = ["/dashboard", "/host", "/quiz", "/learn", "/tryout", "/join", "/stat"].some(p => pathname.startsWith(p));
          if (isProtected) {
            window.location.href = "/login";
          }
        }
      }
      
      if (!initialLoad) {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", checkSession);
    };
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
    nickname: string,
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
        nickname,
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
