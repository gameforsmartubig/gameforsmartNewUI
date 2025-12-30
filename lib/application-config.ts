/**
 * Application Configuration
 * Manages different applications that use the same database
 */

export interface ApplicationConfig {
  id: string;
  name: string;
  domain: string;
  displayName: string;
  description: string;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
}

// Available applications
export const APPLICATIONS: Record<string, ApplicationConfig> = {
  "gameforsmart.com": {
    id: "gameforsmart.com",
    name: "gameforsmart",
    domain: "gameforsmart.com",
    displayName: "GameForSmart",
    description: "Interactive quiz platform for smart learning",
    theme: {
      primaryColor: "#7C3AED", // purple-600
      secondaryColor: "#3B82F6", // blue-600
      logo: "/images/gameforsmartlogo.png",
    },
  },
  "space-quiz": {
    id: "space-quiz",
    name: "spacequiz",
    domain: "spacequiz.com",
    displayName: "Space Quiz",
    description: "Space-themed quiz adventures",
    theme: {
      primaryColor: "#1E40AF", // blue-800
      secondaryColor: "#7C2D12", // orange-800
    },
  },
  "quiz-rush": {
    id: "quiz-rush",
    name: "quizrush",
    domain: "quizrush.com",
    displayName: "Quiz Rush",
    description: "Fast-paced competitive quizzing",
    theme: {
      primaryColor: "#DC2626", // red-600
      secondaryColor: "#059669", // emerald-600
    },
  },
} as const;

// Default application
export const DEFAULT_APPLICATION = "gameforsmart.com";

/**
 * Get current application based on environment or domain
 */
export function getCurrentApplication(): string {
  // Check environment variable first
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_ID) {
    return process.env.NEXT_PUBLIC_APP_ID;
  }

  // Check domain in browser environment
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // Find application by domain
    for (const [appId, config] of Object.entries(APPLICATIONS)) {
      if (hostname.includes(config.domain) || hostname.includes(config.name)) {
        return appId;
      }
    }
  }

  // Default fallback
  return DEFAULT_APPLICATION;
}

/**
 * Get application configuration
 */
export function getApplicationConfig(appId?: string): ApplicationConfig {
  const currentApp = appId || getCurrentApplication();
  return APPLICATIONS[currentApp] || APPLICATIONS[DEFAULT_APPLICATION];
}

/**
 * Check if application ID is valid
 */
export function isValidApplication(appId: string): boolean {
  return appId in APPLICATIONS;
}

/**
 * Get all available applications
 */
export function getAllApplications(): ApplicationConfig[] {
  return Object.values(APPLICATIONS);
}

/**
 * Set application context in Supabase
 * This should be called when initializing the application
 */
export async function setApplicationContext(supabase: any, appId?: string) {
  const currentApp = appId || getCurrentApplication();

  try {
    // Set application context using the function we created in migration
    await supabase.rpc("set_application_context", { app_name: currentApp });
    console.log(`✅ Application context set to: ${currentApp}`);
  } catch (error) {
    console.warn("⚠️ Failed to set application context:", error);
    // This is not critical, continue without context
  }
}

/**
 * Get application-specific database filters
 */
export function getApplicationFilters(appId?: string) {
  const currentApp = appId || getCurrentApplication();

  return {
    application: currentApp,
  };
}

/**
 * Utility to add application field to insert data
 */
export function withApplication<T extends Record<string, any>>(
  data: T,
  appId?: string
): T & { application: string } {
  const currentApp = appId || getCurrentApplication();

  return {
    ...data,
    application: currentApp,
  };
}

// Export types
export type ApplicationId = keyof typeof APPLICATIONS;

