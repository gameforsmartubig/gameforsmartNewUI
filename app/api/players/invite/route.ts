import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Environment variables with fallbacks
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-key";

// Initialize Supabase client for server operations
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/players/invite
 * Invite individual players to join a game from waiting room
 * Players will receive notification in dashboard and can join without entering PIN
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🚀 POST /api/players/invite called - Individual Player Invitation");

    // Get auth token from headers
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify the user
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { usernames, gameTitle, gamePin, sessionId } = body;

    console.log("📥 Request data:", {
      usernames,
      gameTitle,
      gamePin,
      sessionId,
    });

    // Validate input
    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return NextResponse.json(
        { error: "Usernames array is required" },
        { status: 400 }
      );
    }

    if (!gameTitle || !gamePin) {
      return NextResponse.json(
        { error: "Game title and PIN are required" },
        { status: 400 }
      );
    }

    // Get host profile info
    const { data: hostProfile, error: hostError } = await supabaseServer
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("auth_user_id", user.id)
      .single();

    if (hostError || !hostProfile) {
      console.error("❌ Host profile not found:", hostError);
      return NextResponse.json(
        { error: "Host profile not found" },
        { status: 404 }
      );
    }

    const hostName = hostProfile.username || user.email?.split("@")[0] || "Host";
    const hostId = hostProfile.id;
    const hostAvatar = hostProfile.avatar_url;

    console.log(`📤 Inviting as: ${hostName}`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const successUsers: string[] = [];

    // Process each username
    const pushNotificationTargets: string[] = [];

    for (const username of usernames) {
      try {
        console.log(`📋 Processing invitation for: ${username}`);

        // Find user by username - get both id and auth_user_id
        const { data: targetUser, error: userError } = await supabaseServer
          .from("profiles")
          .select("id, auth_user_id, username, fullname")
          .eq("username", username)
          .single();

        if (userError || !targetUser) {
          console.log(`❌ User ${username} not found`);
          errors.push(`User ${username} not found`);
          errorCount++;
          continue;
        }

        // Don't invite yourself
        if (targetUser.id === hostId) {
          console.log(`⚠️ Skipping self-invitation for ${username}`);
          errors.push(`Cannot invite yourself`);
          errorCount++;
          continue;
        }

        // Create notification using RPC - use auth_user_id (UUID) not id (XID)
        const { data: notificationId, error: rpcError } = await supabaseServer.rpc(
          "add_user_notification",
          {
            p_user_id: targetUser.auth_user_id, // Use UUID not XID
            p_type: "game_invitation",
            p_title: "🎮 Undangan Bermain Game!",
            p_message: `mengundang kamu bermain "${gameTitle}"`,
            p_data: {
              inviter: hostName,
              inviter_avatar: hostAvatar,
              title: gameTitle,
              pin: gamePin,
              session_id: sessionId, // ✅ ADD SESSION ID FOR STATUS TRACKING
            },
            p_expires_at: null, // Notifications expire when game starts
          }
        );

        if (rpcError) {
          console.error(
            `❌ Error creating notification for ${username}:`,
            rpcError
          );
          errors.push(`Failed to invite ${username}: ${rpcError.message}`);
          errorCount++;
        } else {
          successCount++;
          successUsers.push(username);
          // Add to push notification targets
          if (targetUser.auth_user_id) {
            pushNotificationTargets.push(targetUser.auth_user_id);
          }
          console.log(
            `✅ Successfully invited ${username}, notification ID: ${notificationId}`
          );
        }
      } catch (error) {
        console.error(`Error processing user ${username}:`, error);
        errors.push(
          `Failed to invite ${username}: ${error instanceof Error ? error.message : "Unknown error"
          }`
        );
        errorCount++;
      }
    }

    // Send push notifications if any users were successfully invited
    if (pushNotificationTargets.length > 0) {
      try {
        console.log(`🚀 Sending push notifications to ${pushNotificationTargets.length} users...`);

        const { error: pushError } = await supabaseServer.functions.invoke('send-push-notification', {
          body: {
            userIds: pushNotificationTargets,
            type: 'game_invite',
            payload: {
              title: '🎮 Game Invitation',
              body: `${hostName} invited you to play ${gameTitle}!`,
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              requireInteraction: true,
              vibrate: [200, 100, 200],
              data: {
                url: `/join?pin=${gamePin}`,
                gamePin,
                sessionId
              }
            },
            data: {
              gamePin,
              inviterName: hostName,
              quizTitle: gameTitle,
              sessionId,
              timestamp: new Date().toISOString(),
            }
          }
        });

        if (pushError) {
          console.error('❌ Failed to send push notifications:', pushError);
        } else {
          console.log('✅ Push notifications sent successfully');
        }
      } catch (err) {
        console.error('❌ Exception sending push notifications:', err);
      }
    }

    console.log(
      `🎯 Final results: ${successCount} success, ${errorCount} errors`
    );

    // Return result summary
    const response = {
      success: successCount > 0,
      successCount,
      errorCount,
      totalUsers: usernames.length,
      successUsers,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully invited ${successCount} out of ${usernames.length} players`,
      invitationType: "direct_player_invitation",
    };

    console.log("📤 Sending response:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send player invitations",
      },
      { status: 500 }
    );
  }
}

// GET handler for testing
export async function GET() {
  return NextResponse.json({
    message: "Players invite API is working - JSONB Notifications",
    methods: ["POST"],
    endpoint: "/api/players/invite",
    features: [
      "Invite individual players to games",
      "No PIN required for invited players",
      "Notifications stored in profiles.notifications JSONB",
      "Real-time delivery",
    ],
    usage: {
      method: "POST",
      body: {
        usernames: ["string[]"],
        gameTitle: "string",
        gamePin: "string",
        sessionId: "string (optional)",
      },
    },
  });
}

