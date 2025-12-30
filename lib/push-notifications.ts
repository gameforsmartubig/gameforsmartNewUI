import { supabase } from '@/lib/supabase';

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  data?: any;
}

// Check if sender has permission to send notification to receivers
async function filterAllowedReceivers(
  senderId: string,
  receiverIds: string[]
): Promise<string[]> {
  try {
    // Get accepted permissions from database
    const { data, error } = await supabase
      .from('notification_permissions')
      .select('receiver_id')
      .eq('requester_id', senderId)
      .in('receiver_id', receiverIds)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error checking permissions:', error);
      // On error, return empty array (fail safe - don't send without permission)
      return [];
    }

    return data?.map((d) => d.receiver_id) || [];
  } catch (error) {
    console.error('Error filtering allowed receivers:', error);
    return [];
  }
}

// Helper function to call push notification API
async function sendPushViaAPI(
  userIds: string[],
  payload: any,
  data: any
): Promise<boolean> {
  try {
    const response = await fetch('/api/push-notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds, payload, data }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Failed to send push via API:', error);
    return false;
  }
}

// Send push with permission check
async function sendPushWithPermission(
  senderId: string,
  receiverIds: string[],
  payload: any,
  data: any
): Promise<boolean> {
  // Filter to only allowed receivers
  const allowedReceivers = await filterAllowedReceivers(senderId, receiverIds);
  
  if (allowedReceivers.length === 0) {
    console.log('No receivers have granted permission');
    return true; // Not an error, just no one to send to
  }

  console.log(`Sending push to ${allowedReceivers.length}/${receiverIds.length} allowed receivers`);
  return sendPushViaAPI(allowedReceivers, payload, data);
}

// Send game invite notification
export async function sendGameInviteNotification(
  targetUserId: string,
  inviterName: string,
  gamePin: string,
  quizTitle?: string
): Promise<boolean> {
  return sendPushViaAPI(
    [targetUserId],
    {
      title: 'Game Invitation 🎮',
      body: `${inviterName} invited you to play ${quizTitle || 'a quiz game'}!`,
    },
    {
      type: 'game_invite',
      gamePin,
      inviterName,
      quizTitle,
      url: `/play?pin=${gamePin}`,
    }
  );
}

// Send friend invite notification
export async function sendFriendInviteNotification(
  targetUserId: string,
  requesterName: string,
  requesterId: string
): Promise<boolean> {
  return sendPushViaAPI(
    [targetUserId],
    {
      title: 'Friend Request 👋',
      body: `${requesterName} sent you a friend request!`,
    },
    {
      type: 'friend_invite',
      requesterId,
      requesterName,
      url: '/friends',
    }
  );
}

// Send group invite notification
export async function sendGroupInviteNotification(
  targetUserId: string,
  inviterName: string,
  groupId: string,
  groupName: string,
  invitationId: string
): Promise<boolean> {
  return sendPushViaAPI(
    [targetUserId],
    {
      title: 'Group Invitation 👥',
      body: `${inviterName} invited you to join "${groupName}"`,
    },
    {
      type: 'group_invite',
      groupId,
      groupName,
      inviterName,
      invitationId,
      url: `/groups/${groupId}`,
    }
  );
}

// Send multiple game invites
export async function sendMultipleGameInvites(
  targetUserIds: string[],
  inviterName: string,
  gamePin: string,
  quizTitle?: string
): Promise<boolean> {
  return sendPushViaAPI(
    targetUserIds,
    {
      title: 'Game Invitation 🎮',
      body: `${inviterName} invited you to play ${quizTitle || 'a quiz game'}!`,
    },
    {
      type: 'game_invite',
      gamePin,
      inviterName,
      quizTitle,
      url: `/play?pin=${gamePin}`,
    }
  );
}

// Send game completed notification to all participants and host
// Only sends to users who have granted permission to the sender
export async function sendGameCompletedNotification(
  sessionId: string,
  quizTitle: string,
  finisherNickname?: string,
  finisherUserId?: string
): Promise<boolean> {
  try {
    // Get game session with host and participants
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('host_id, participants')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Failed to get game session:', sessionError);
      return false;
    }

    // Determine who is the sender (the one triggering the notification)
    const senderId = finisherUserId || session.host_id;

    const targetUserIds: string[] = [];
    
    // Add host (if not the finisher/sender)
    if (session.host_id && session.host_id !== senderId) {
      targetUserIds.push(session.host_id);
    }

    // Add participants with user_id (except sender)
    const participants = session.participants || [];
    participants.forEach((participant: any) => {
      if (participant.user_id && participant.user_id !== senderId) {
        targetUserIds.push(participant.user_id);
      }
    });

    if (targetUserIds.length === 0) {
      console.log('No recipients for game completed notification');
      return true;
    }

    // Remove duplicates
    const uniqueTargetUserIds = [...new Set(targetUserIds)];

    const notificationBody = finisherNickname 
      ? `${finisherNickname} has finished "${quizTitle}"! Check the results.`
      : `The game "${quizTitle}" has ended. Check the results!`;

    // Send with permission check
    return sendPushWithPermission(
      senderId,
      uniqueTargetUserIds,
      {
        title: 'Game Completed! 🎮',
        body: notificationBody,
      },
      {
        type: 'game_completed',
        sessionId,
        quizTitle,
        finisherNickname,
        url: `/results/${sessionId}`,
      }
    );
  } catch (error) {
    console.error('Error sending game completed notification:', error);
    return false;
  }
}

// Send notification to host when player completes the game
// Only sends if player has permission to notify host
export async function sendPlayerCompletedNotification(
  hostUserId: string,
  playerUserId: string,
  playerNickname: string,
  sessionId: string,
  quizTitle: string,
  playerScore: number
): Promise<boolean> {
  return sendPushWithPermission(
    playerUserId,
    [hostUserId],
    {
      title: 'Player Finished! 🏆',
      body: `${playerNickname} completed "${quizTitle}" with ${playerScore} points!`,
    },
    {
      type: 'player_completed',
      sessionId,
      quizTitle,
      playerNickname,
      playerScore,
      url: `/host-active/${sessionId}`,
    }
  );
}

// Send custom notification
export async function sendCustomNotification(
  targetUserId: string,
  notification: NotificationData
): Promise<boolean> {
  return sendPushViaAPI(
    [targetUserId],
    {
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
    },
    {
      type: 'custom',
      ...notification.data,
    }
  );
}

// Send quiz finished notification to all accepted notification recipients
// This is called when a player finishes playing a quiz
export async function sendQuizFinishedToRecipients(
  playerUserId: string,
  playerNickname: string,
  quizTitle: string,
  playerScore: number,
  sessionId: string,
  participantId?: string
): Promise<boolean> {
  try {
    // Get player's profile info for avatar
    const { data: playerProfile } = await supabase
      .from('profiles')
      .select('avatar_url, fullname, username')
      .eq('id', playerUserId)
      .single();

    const playerAvatar = playerProfile?.avatar_url || null;
    const playerFullname = playerProfile?.fullname || playerProfile?.username || playerNickname;

    // Get all accepted notification permissions where this player is the requester
    const { data: permissions, error: permError } = await supabase
      .from('notification_permissions')
      .select('receiver_id')
      .eq('requester_id', playerUserId)
      .eq('status', 'accepted');

    if (permError) {
      console.error('Error fetching notification permissions:', permError);
      return false;
    }

    if (!permissions || permissions.length === 0) {
      console.log('No accepted notification recipients for this player');
      return true; // Not an error, just no recipients
    }

    const recipientIds = permissions.map((p) => p.receiver_id);
    console.log(`📢 Sending quiz finished notification to ${recipientIds.length} recipients`);

    // Send push notification to all recipients (API also adds in-app notifications)
    return sendPushViaAPI(
      recipientIds,
      {
        title: 'Quiz Selesai! 🎉',
        body: `Menyelesaikan quiz "${quizTitle}" dengan skor ${playerScore} poin!`,
      },
      {
        type: 'quiz_finished',
        sessionId,
        quizTitle,
        playerNickname: playerFullname,
        playerScore,
        playerAvatar,
        playerUserId,
        participantId,
        url: `/results/${sessionId}${participantId ? `?participant=${participantId}` : ''}`,
      }
    );
  } catch (error) {
    console.error('Error sending quiz finished notifications:', error);
    return false;
  }
}

// Add in-app notification only (no push)
export async function addInAppNotification(
  targetUserId: string,
  type: string,
  title: string,
  message: string,
  data?: any
): Promise<boolean> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('notifications')
      .eq('id', targetUserId)
      .single();

    if (profileError || !profile) {
      console.error('Failed to get profile:', profileError);
      return false;
    }

    const currentNotifications = profile.notifications || [];
    const newNotification = {
      id: crypto.randomUUID(),
      type,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString(),
      data: data || {},
    };

    const updatedNotifications = [
      newNotification,
      ...currentNotifications
    ].slice(0, 50);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ notifications: updatedNotifications })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('Failed to update notifications:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error adding in-app notification:', error);
    return false;
  }
}
