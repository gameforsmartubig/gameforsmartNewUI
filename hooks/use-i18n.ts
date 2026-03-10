import { useState, useEffect, useCallback, useRef } from "react";
import {
  Language,
  t,
  setLanguage,
  getCurrentLanguage,
  initializeI18n,
  supportedLanguages,
} from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

export const useI18n = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);
  // OPTIMIZED: Use profile from AuthContext instead of separate query
  const { user, profile, loading: authLoading } = useAuth();
  const initialized = useRef(false);

  // OPTIMIZED: Initialize i18n using profile from context
  useEffect(() => {
    const initialize = async () => {
      // Wait for auth to finish loading
      if (authLoading) return;
      
      // Prevent double initialization
      if (initialized.current && !profile?.language) return;
      
      setIsLoading(true);
      try {
        // If user is logged in and profile loaded, use language from profile
        if (user && profile?.language) {
          const userLanguage = profile.language as Language;
          await initializeI18n(userLanguage);
          setCurrentLanguage(getCurrentLanguage());
          initialized.current = true;
        } else if (!user) {
          // For non-logged in users, use localStorage or default
          await initializeI18n();
          setCurrentLanguage(getCurrentLanguage());
          initialized.current = true;
        } else {
          // User logged in but no profile yet - use localStorage/default
          await initializeI18n();
          setCurrentLanguage(getCurrentLanguage());
        }
      } catch (error) {
        console.error("Failed to initialize i18n:", error);
        await initializeI18n();
        setCurrentLanguage(getCurrentLanguage());
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [user, profile?.language, authLoading]);

  // Change language function
  const changeLanguage = useCallback(
    async (language: Language) => {
      setIsLoading(true);
      try {
        await setLanguage(language);
        setCurrentLanguage(language);

        // Update user profile if logged in
        if (user) {
          const { error } = await supabase
            .from("profiles")
            .update({ language })
            .eq("auth_user_id", user.id);

          if (error) {
            console.error("Failed to update language in profile:", error);
          }
        }

        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("language", language);
        }
      } catch (error) {
        console.error("Failed to change language:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    currentLanguage,
    changeLanguage,
    t,
    isLoading,
    supportedLanguages,
  };
};
