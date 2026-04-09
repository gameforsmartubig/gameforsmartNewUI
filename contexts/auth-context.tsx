"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSessionFromCookie, supabase, syncSessionCookie } from "@/lib/supabase-browser";

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
    // Get initial session
    const initSession = async () => {
      let { data: { session } } = await supabase.auth.getSession();

      // SSO: Coba pulihkan sesi dari shared cookie jika tidak ada
      if (!session) {
        const cookieSession = getSessionFromCookie();
        if (cookieSession) {
          console.log('[SSO] Mencoba pulihkan sesi dari shared cookie (setSession)...');
          // Pakai setSession untuk menghindari rotasi token
          const { data, error } = await supabase.auth.setSession(cookieSession);
          if (!error && data.session) {
            session = data.session;
            console.log('[SSO] Sesi berhasil dipulihkan! Memuat ulang halaman untuk memicu Server Components...');
            window.location.reload();
            return; // Hentikan eksekusi selanjutnya karena halaman akan reload
          } else {
            console.warn('[SSO] Token expired, menghapus cookie');
            syncSessionCookie(null);
          }
        }
      }

      setUser(session?.user ?? null);
      if (session?.user && session) {
        // Sync tokens ke shared cookie
        syncSessionCookie({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
        await fetchProfile(session.user.id);
      }
      setLoading(false);
      setInitialLoad(false);
    };

    initSession();

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (event === "SIGNED_IN" && currentUser && session) {
        // Sync tokens ke shared cookie saat login berhasil
        syncSessionCookie({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
        fetchProfile(session.user.id);
      } else if (event === "TOKEN_REFRESHED" && session) {
        // Update cookie saat token di-refresh (token baru untuk semua app)
        syncSessionCookie({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
      } else if (event === "SIGNED_OUT") {
        // Hapus shared cookie saat logout -> semua app ikut logout
        syncSessionCookie(null);
        localStorage.removeItem("user_id"); // Clear from localStorage
        setUser(null);
        setProfile(null);
        setProfileId(null);
      }
      
      if (!initialLoad) {
        setLoading(false);
      }
    });

    // SINKRONISASI ANTAR-TAB: Cek cookie saat user kembali ke tab ini
    const syncFromCookie = async () => {
      const cookieSession = getSessionFromCookie();
      const { data: { session: localSession } } = await supabase.auth.getSession();
      const isLocallyLoggedIn = !!localSession;

      // Logout sync: cookie kosong tapi kita masih login
      if (!cookieSession && isLocallyLoggedIn) {
        console.log('[SSO] Logout terdeteksi di app lain, sinkronisasi...');
        await supabase.auth.signOut();
        window.location.reload();
        return;
      }

      // Token sync: cookie ada dan kita sudah login, pastikan token sama
      if (cookieSession && isLocallyLoggedIn) {
        if (localSession.access_token !== cookieSession.access_token) {
          console.log('[SSO] Token baru terdeteksi, mengupdate session lokal...');
          await supabase.auth.setSession(cookieSession);
        }
      }
      
      // Jika belum login, tapi tiba-tiba ada cookie (baru login di tab lain)
      if (!isLocallyLoggedIn && cookieSession) {
        console.log('[SSO] Login dari tab lain terdeteksi, sinkronisasi...');
        await supabase.auth.setSession(cookieSession);
        window.location.reload();
      }
    };

    window.addEventListener('focus', syncFromCookie);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncFromCookie();
    };
    window.addEventListener('visibilitychange', onVisibilityChange);


    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', syncFromCookie);
      window.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []); // Kosongkan dependency agar tidak subscribe berulang kali

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        // localStorage.setItem("user_id", session.user.id); // REMOVE: We want profile.id, not auth user id
        await fetchProfile(session.user.id);
      }
      setLoading(false);
      setInitialLoad(false);
    };

    initSession();

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // localStorage.setItem("user_id", session.user.id); // REMOVE: We want profile.id, not auth user id
        fetchProfile(session.user.id);
      } else {
        localStorage.removeItem("user_id"); // Clear from localStorage
        setProfile(null);
        setProfileId(null);
      }
      if (!initialLoad) {
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
