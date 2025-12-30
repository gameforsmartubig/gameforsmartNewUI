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

// POST - Send group invitations to quiz games (CARD NOTIFICATIONS ONLY)
export async function POST(request: NextRequest) {
  try {
    console.log("🚀 POST /api/groups/invite called - Card Notifications Only");

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
    const { groupIds, gameTitle, gamePin, sessionId } = body;

    console.log("📥 Request data:", {
      groupIds,
      gameTitle,
      gamePin,
      sessionId,
    });

    // Validate input
    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return NextResponse.json(
        { error: "Group IDs are required" },
        { status: 400 }
      );
    }

    if (!gameTitle || !gamePin) {
      return NextResponse.json(
        { error: "Game title and PIN are required" },
        { status: 400 }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    let totalNotificationsSent = 0;

    console.log(`🔄 Processing invitations for ${groupIds.length} groups...`);

    // Process each group invitation
    const pushNotificationTargets: string[] = [];

    for (const groupId of groupIds) {
      try {
        console.log(`📋 Processing group: ${groupId}`);

        // Verify user has permission to invite in this group (owner, admin or moderator) using JSONB
        const { data: groupData, error: groupError } = await supabaseServer
          .from("groups")
          .select("members, creator_id")
          .eq("id", groupId)
          .single();

        if (groupError || !groupData) {
          console.log(`❌ Group ${groupId} not found`);
          errors.push(`Group ${groupId} not found`);
          errorCount++;
          continue;
        }

        // Get user's profile ID (XID) first
        const { data: userProfile, error: profileError } = await supabaseServer
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (profileError || !userProfile) {
          console.log(`❌ User profile not found for auth_user_id ${user.id}`);
          errors.push(`User profile not found`);
          errorCount++;
          continue;
        }

        const userProfileId = userProfile.id; // This is XID (TEXT)

        // Check if user is creator or find their role in members JSONB
        let userRole = null;
        if (groupData.creator_id === userProfileId) {
          userRole = "owner";
        } else {
          const members = groupData.members || [];
          const userMember = members.find(
            (member: any) => member.user_id === userProfileId
          );
          userRole = userMember?.role;
        }

        if (!userRole || !["owner", "admin", "moderator"].includes(userRole)) {
          console.log(`❌ No permission for group ${groupId}`);
          errors.push(`No permission to invite in group ${groupId}`);
          errorCount++;
          continue;
        }

        console.log(`✅ User has ${userRole} permission in group ${groupId}`);

        // Skip group chat messages - only send card notifications

        // Get all group members from JSONB (excluding the sender)
        const allMembers = groupData.members || [];
        const membersToNotify = allMembers.filter(
          (member: any) => member.user_id !== userProfileId // Use profile ID (XID) not auth_user_id
        );

        if (membersToNotify.length === 0) {
          console.log(`⚠️ No members to notify in group ${groupId}`);
          continue; // No members to notify
        }

        console.log(
          `👥 Found ${membersToNotify.length} members to notify in group ${groupId}`
        );

        // Get sender info and group name
        const [senderResult, groupResult] = await Promise.all([
          supabaseServer
            .from("profiles")
            .select("id, username, avatar_url")
            .eq("auth_user_id", user.id)
            .single(),
          supabaseServer
            .from("groups")
            .select("name, avatar_url")
            .eq("id", groupId)
            .single(),
        ]);

        const senderName =
          senderResult.data?.username || user.email?.split("@")[0] || "Someone";
        const senderProfileId = senderResult.data?.id;
        const senderAvatar = senderResult.data?.avatar_url;
        const groupName = groupResult.data?.name || "Unknown Group";
        const groupAvatar = groupResult.data?.avatar_url;

        console.log(`📤 Sending as: ${senderName} from group: ${groupName}`);

        // Use RPC function to add notifications to profiles.notifications JSONB
        console.log(
          `🔔 Creating ${membersToNotify.length} notifications using RPC...`
        );

        let notificationsCreated = 0;
        const notificationErrors: string[] = [];

        // Get auth_user_id for all members (convert XID to UUID)
        const memberProfileIds = membersToNotify.map((m: any) => m.user_id);
        const { data: memberProfiles, error: memberProfileError } = await supabaseServer
          .from("profiles")
          .select("id, auth_user_id")
          .in("id", memberProfileIds);

        if (memberProfileError) {
          console.error("❌ Error fetching member profiles:", memberProfileError);
          errors.push(`Failed to get member profiles for group ${groupId}`);
          errorCount++;
          continue;
        }

        // Create map of XID -> UUID
        const profileMap = new Map(
          (memberProfiles || []).map((p: any) => [p.id, p.auth_user_id])
        );

        for (const member of membersToNotify) {
          try {
            const authUserId = profileMap.get(member.user_id);
            if (!authUserId) {
              console.error(`❌ Could not find auth_user_id for ${member.user_id}`);
              notificationErrors.push(`User ${member.user_id}: Profile not found`);
              continue;
            }

            const { data, error: rpcError } = await supabaseServer.rpc(
              "add_user_notification",
              {
                p_user_id: authUserId, // Use UUID (auth_user_id) not XID
                p_type: "group_quiz_invitation",
                p_title: "🎯 Undangan Quiz dari Grup!",
                p_message: `mengundang kamu bermain quiz "${gameTitle}"`,
                p_data: {
                  // Quiz information
                  title: gameTitle,
                  pin: gamePin,
                  session_id: sessionId,

                  // Group information
                  group_id: groupId,
                  group_name: groupName,
                  group_avatar: groupAvatar,

                  // Inviter information
                  inviter: senderName,
                  inviter_id: senderProfileId,
                  inviter_avatar: senderAvatar,
                },
                p_expires_at: null,
              }
            );

            if (rpcError) {
              console.error(
                `❌ Error creating notification for user ${member.user_id}:`,
                rpcError
              );
              notificationErrors.push(
                `User ${member.user_id}: ${rpcError.message}`
              );
            } else {
              notificationsCreated++;
              // Add to push notification targets
              pushNotificationTargets.push(authUserId);
              console.log(
                `✅ Notification created for user ${member.user_id}, ID: ${data}`
              );
            }
          } catch (err) {
            console.error(
              `❌ Exception creating notification for user ${member.user_id}:`,
              err
            );
            notificationErrors.push(
              `User ${member.user_id}: ${err instanceof Error ? err.message : "Unknown error"}`
            );
          }
        }

        const notifError =
          notificationErrors.length > 0 ? notificationErrors.join("; ") : null;

        if (notifError) {
          console.error("❌ Error creating notifications:", notifError);
          errors.push(
            `Failed to send notifications for group ${groupId}: ${notifError}`
          );
          errorCount++;
        } else {
          successCount++;
          totalNotificationsSent += notificationsCreated;
          console.log(
            `✅ Successfully sent ${notificationsCreated} card notifications for group ${groupId}`
          );
        }
      } catch (error) {
        console.error(`Error processing group ${groupId}:`, error);
        errors.push(
          `Failed to process group ${groupId}: ${error instanceof Error ? error.message : "Unknown error"
          }`
        );
        errorCount++;
      }
    }

    // Send push notifications if any users were successfully invited
    if (pushNotificationTargets.length > 0) {
      try {
        console.log(`🚀 Sending push notifications to ${pushNotificationTargets.length} users...`);

        // Remove duplicates
        const uniqueTargets = [...new Set(pushNotificationTargets)];

        const { error: pushError } = await supabaseServer.functions.invoke('send-push-notification', {
          body: {
            userIds: uniqueTargets,
            type: 'game_invite', // Use game_invite type for group quiz invites too
            payload: {
              title: '🎯 Group Quiz Invitation',
              body: `Your group is playing ${gameTitle}! Join now!`,
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
      `🎯 Final results: ${successCount} success, ${errorCount} errors, ${totalNotificationsSent} total notifications`
    );

    // Return result summary
    const response = {
      success: true,
      successCount,
      errorCount,
      totalGroups: groupIds.length,
      totalNotificationsSent,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully sent quiz invitations to ${successCount} out of ${groupIds.length} groups via JSONB notifications`,
      invitationType: "jsonb_notifications",
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
            : "Failed to send group invitations",
      },
      { status: 500 }
    );
  }
}

// GET handler for testing
export async function GET() {
  return NextResponse.json({
    message: "Groups invite API is working - Card Notifications Only",
    methods: ["POST"],
    endpoint: "/api/groups/invite",
    features: [
      "Send quiz invitations to group members",
      "Card notifications only (no group chat messages)",
      "Real-time delivery via Supabase subscriptions",
      "Permission-based (admin/moderator only)",
    ],
  });
}
