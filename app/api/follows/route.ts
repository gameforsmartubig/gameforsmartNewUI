import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'following'; // 'following', 'followers', 'blocked'
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get profile.id (XID) from either auth_user_id (UUID) or profiles.id (XID)
    // Frontend might send either type
    let userIdStr: string;
    
    // Try by auth_user_id first (most common)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, auth_user_id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!profileData) {
      // Fallback: Try by id (XID)
      const { data: profileByIdData } = await supabase
        .from('profiles')
        .select('id, auth_user_id')
        .eq('id', userId)
        .maybeSingle();
      
      if (!profileByIdData) {
        console.error('User profile not found:', { userId, error: profileError });
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }
      userIdStr = profileByIdData.id;
    } else {
      userIdStr = profileData.id; // This is the XID from profiles.id
    }

    let data, error, count;

    // Log the type parameter for debugging
    console.log('GET /api/follows - type:', type, 'userId:', userId);

    // Normalize type parameter (trim whitespace, convert to lowercase)
    const normalizedType = type.trim().toLowerCase();

    switch (normalizedType) {
       case 'requests_received':
         // Get pending follow requests received by this user
         const { data: requestsData, error: requestsError } = await supabase
           .from('friendships')
           .select(`
             id,
             requester_id,
             addressee_id,
             status,
             created_at,
             requester_profiles:profiles!friendships_requester_id_fkey (
               id,
               username,
               fullname,
               nickname,
               avatar_url,
               last_active,
               countries (name),
               states (name),
               cities (name)
             )
           `)
           .eq('addressee_id', userIdStr)
           .eq('status', 'pending')
           .range(offset, offset + limit - 1);

         if (requestsError) throw requestsError;

         // Process the data to get the users who sent requests
         const processedRequests = (requestsData || []).map((request: any) => {
           const requesterUser = request.requester_profiles;
           
           return {
             follow_id: request.id,
             user_id: requesterUser.id,
             username: requesterUser.username,
             fullname: requesterUser.fullname,
             nickname: requesterUser.nickname,
             avatar_url: requesterUser.avatar_url,
             last_active: requesterUser.last_active,
             is_online: requesterUser.last_active && 
               new Date(requesterUser.last_active) > new Date(Date.now() - 15 * 60 * 1000),
             countries: requesterUser.countries,
             states: requesterUser.states,
             cities: requesterUser.cities,
             requested_at: request.created_at,
             status: 'pending'
           };
         });

         // Filter by search if provided
         const filteredRequests = search ? processedRequests.filter((user: any) => 
           user.username?.toLowerCase().includes(search.toLowerCase()) ||
           user.fullname?.toLowerCase().includes(search.toLowerCase())
         ) : processedRequests;

         // Get total count
         const { count: requestsCount, error: requestsCountError } = await supabase
           .from('friendships')
           .select('*', { count: 'exact', head: true })
           .eq('addressee_id', userIdStr)
           .eq('status', 'pending');

         if (requestsCountError) throw requestsCountError;

         return NextResponse.json({
           data: filteredRequests,
           pagination: {
             page,
             limit,
             total: requestsCount || 0,
             totalPages: Math.ceil((requestsCount || 0) / limit)
           }
         });

       case 'requests_sent':
         // Get pending follow requests sent by this user
         const { data: sentRequestsData, error: sentRequestsError } = await supabase
           .from('friendships')
           .select(`
             id,
             requester_id,
             addressee_id,
             status,
             created_at,
             profiles!friendships_addressee_id_fkey (
               id,
               username,
               fullname,
               nickname,
               avatar_url,
               last_active,
               countries (name),
               states (name),
               cities (name)
             )
           `)
           .eq('requester_id', userIdStr)
           .eq('status', 'pending')
           .range(offset, offset + limit - 1);

         if (sentRequestsError) throw sentRequestsError;

         // Process the data to get the users to whom requests were sent
         const processedSentRequests = (sentRequestsData || []).map((request: any) => {
           const targetUser = request.profiles;
           
           return {
             follow_id: request.id,
             user_id: targetUser.id,
             username: targetUser.username,
             fullname: targetUser.fullname,
             nickname: targetUser.nickname,
             avatar_url: targetUser.avatar_url,
             last_active: targetUser.last_active,
             is_online: targetUser.last_active && 
               new Date(targetUser.last_active) > new Date(Date.now() - 15 * 60 * 1000),
             countries: targetUser.countries,
             states: targetUser.states,
             cities: targetUser.cities,
             requested_at: request.created_at,
             status: 'pending'
           };
         });

         // Filter by search if provided
         const filteredSentRequests = search ? processedSentRequests.filter((user: any) => 
           user.username?.toLowerCase().includes(search.toLowerCase()) ||
           user.fullname?.toLowerCase().includes(search.toLowerCase())
         ) : processedSentRequests;

         // Get total count
         const { count: sentRequestsCount, error: sentRequestsCountError } = await supabase
           .from('friendships')
           .select('*', { count: 'exact', head: true })
           .eq('requester_id', userIdStr)
           .eq('status', 'pending');

         if (sentRequestsCountError) throw sentRequestsCountError;

         return NextResponse.json({
           data: filteredSentRequests,
           pagination: {
             page,
             limit,
             total: sentRequestsCount || 0,
             totalPages: Math.ceil((sentRequestsCount || 0) / limit)
           }
         });

       case 'following':
        // OPTIMIZED: Get all data in parallel
        const [followingResult, allFollowingResult] = await Promise.all([
          // Get paginated following data with profiles
          supabase
            .from('friendships')
            .select(`
              id,
              requester_id,
              addressee_id,
              status,
              created_at,
              profiles!friendships_addressee_id_fkey (
                id,
                username,
                fullname,
                nickname,
                avatar_url,
                last_active,
                countries (name),
                states (name),
                cities (name)
              )
            `)
            .eq('requester_id', userIdStr)
            .eq('status', 'accepted')
            .order('created_at', { ascending: false }),
          // Get all following IDs for mutual check (no limit)
          supabase
            .from('friendships')
            .select('addressee_id')
            .eq('requester_id', userIdStr)
            .eq('status', 'accepted')
        ]);

        if (followingResult.error) throw followingResult.error;
        if (allFollowingResult.error) throw allFollowingResult.error;

        const followingData = followingResult.data || [];
        const allFollowingData = allFollowingResult.data || [];

        // Get all mutual follows in one query
        let mutualFollows: string[] = [];
        if (allFollowingData.length > 0) {
          const allFollowingIds = allFollowingData.map(f => f.addressee_id);
          const { data: allMutualData } = await supabase
            .from('friendships')
            .select('requester_id')
            .eq('addressee_id', userIdStr)
            .eq('status', 'accepted')
            .in('requester_id', allFollowingIds);
          
          mutualFollows = allMutualData?.map(m => m.requester_id) || [];
        }

        // Process and filter data - EXCLUDE friends (mutual follows)
        const processedFollowing = followingData
          .filter((friendship: any) => {
            const followedUser = friendship.profiles;
            return followedUser && !mutualFollows.includes(followedUser.id);
          })
          .map((friendship: any) => {
            const followedUser = friendship.profiles;
            return {
              follow_id: friendship.id,
              user_id: followedUser.id,
              username: followedUser.username,
              fullname: followedUser.fullname,
              nickname: followedUser.nickname,
              avatar_url: followedUser.avatar_url,
              last_active: followedUser.last_active,
              is_online: followedUser.last_active && 
                new Date(followedUser.last_active) > new Date(Date.now() - 15 * 60 * 1000),
              countries: followedUser.countries,
              states: followedUser.states,
              cities: followedUser.cities,
              followed_at: friendship.created_at,
              is_mutual: false,
              is_friend: false,
              relationship_status: 'following'
            };
          });

        // Filter by search if provided
        const filteredFollowing = search 
          ? processedFollowing.filter((user: any) => 
              user.username?.toLowerCase().includes(search.toLowerCase()) ||
              user.fullname?.toLowerCase().includes(search.toLowerCase())
            )
          : processedFollowing;

        // Apply pagination to filtered results
        const paginatedFollowing = filteredFollowing.slice(offset, offset + limit);

        // Calculate total count
        const followingCount = filteredFollowing.length;

        return NextResponse.json({
          data: paginatedFollowing,
          pagination: {
            page,
            limit,
            total: followingCount,
            totalPages: Math.ceil(followingCount / limit)
          }
        });

      case 'followers':
        // OPTIMIZED: Get all data in parallel
        const [followersResult, allFollowersResult] = await Promise.all([
          // Get all followers data with profiles
          supabase
            .from('friendships')
            .select(`
              id,
              requester_id,
              addressee_id,
              status,
              created_at,
              requester_profiles:profiles!friendships_requester_id_fkey (
                id,
                username,
                fullname,
                nickname,
                avatar_url,
                last_active,
                countries (name),
                states (name),
                cities (name)
              )
            `)
            .eq('addressee_id', userIdStr)
            .eq('status', 'accepted')
            .order('created_at', { ascending: false }),
          // Get all follower IDs for mutual check
          supabase
            .from('friendships')
            .select('requester_id')
            .eq('addressee_id', userIdStr)
            .eq('status', 'accepted')
        ]);

        if (followersResult.error) throw followersResult.error;
        if (allFollowersResult.error) throw allFollowersResult.error;

        const followersData = followersResult.data || [];
        const allFollowersData = allFollowersResult.data || [];

        // Get all mutual followers in one query
        let mutualFollowers: string[] = [];
        if (allFollowersData.length > 0) {
          const allFollowerIds = allFollowersData.map(f => f.requester_id);
          const { data: allMutualFollowerData } = await supabase
            .from('friendships')
            .select('addressee_id')
            .eq('requester_id', userIdStr)
            .eq('status', 'accepted')
            .in('addressee_id', allFollowerIds);
          
          mutualFollowers = allMutualFollowerData?.map(m => m.addressee_id) || [];
        }

        // Check if current user recently unfollowed any of these followers (within 24 hours)
        let recentlyUnfollowed: string[] = [];
        if (allFollowersData.length > 0) {
          const allFollowerIds = allFollowersData.map(f => f.requester_id);
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          
          // This is a heuristic: if follower created_at is old but there's no reverse follow,
          // and the relationship was created long ago, they might have been mutual
          // For now, we'll mark followers who follow us but we don't follow back
          // and whose relationship is older than 1 day as potentially "was_mutual"
        }

        // Process and filter data - EXCLUDE friends (mutual follows)
        const processedFollowers = followersData
          .filter((friendship: any) => {
            const followerUser = friendship.requester_profiles;
            return followerUser && !mutualFollowers.includes(followerUser.id);
          })
          .map((friendship: any) => {
            const followerUser = friendship.requester_profiles;
            const createdAt = new Date(friendship.created_at);
            const now = new Date();
            const daysSinceFollow = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            
            // If they've been following for more than 1 day and we're not following back,
            // there's a chance we used to be mutual and user unfollowed
            const possiblyWasMutual = daysSinceFollow > 1;
            
            return {
              follow_id: friendship.id,
              user_id: followerUser.id,
              username: followerUser.username,
              fullname: followerUser.fullname,
              nickname: followerUser.nickname,
              avatar_url: followerUser.avatar_url,
              last_active: followerUser.last_active,
              is_online: followerUser.last_active && 
                new Date(followerUser.last_active) > new Date(Date.now() - 15 * 60 * 1000),
              countries: followerUser.countries,
              states: followerUser.states,
              cities: followerUser.cities,
              followed_at: friendship.created_at,
              is_mutual: false,
              is_friend: false,
              was_mutual: possiblyWasMutual,
              relationship_status: 'follower'
            };
          });

        // Filter by search if provided
        const filteredFollowers = search 
          ? processedFollowers.filter((user: any) => 
              user.username?.toLowerCase().includes(search.toLowerCase()) ||
              user.fullname?.toLowerCase().includes(search.toLowerCase())
            )
          : processedFollowers;

        // Apply pagination to filtered results
        const paginatedFollowers = filteredFollowers.slice(offset, offset + limit);

        // Calculate total count
        const followersCount = filteredFollowers.length;

        return NextResponse.json({
          data: paginatedFollowers,
          pagination: {
            page,
            limit,
            total: followersCount,
            totalPages: Math.ceil(followersCount / limit)
          }
        });

       case 'friends':
         // OPTIMIZED: Get friends - users with mutual 'accepted' status
         // Get users this user follows
         const { data: userFollowingData, error: userFollowingError } = await supabase
           .from('friendships')
           .select(`
             id,
             addressee_id,
             created_at
           `)
           .eq('requester_id', userIdStr)
           .eq('status', 'accepted');

         if (userFollowingError) throw userFollowingError;

         if (!userFollowingData || userFollowingData.length === 0) {
           return NextResponse.json({
             data: [],
             pagination: {
               page,
               limit,
               total: 0,
               totalPages: 0
             }
           });
         }

         const userFollowingIds = userFollowingData.map(f => f.addressee_id);
         
         // Create a map of addressee_id -> friendship.id (where current user is requester)
         const followingIdMap = new Map(
           userFollowingData.map(f => [f.addressee_id, f.id])
         );

         // Get all users who also follow back (mutual friends) - no pagination yet
         const { data: mutualFriendsData, error: mutualFriendsError } = await supabase
           .from('friendships')
           .select(`
             id,
             requester_id,
             addressee_id,
             status,
             created_at,
             requester_profiles:profiles!friendships_requester_id_fkey (
               id,
               username,
               fullname,
               nickname,
               avatar_url,
               last_active,
               countries (name),
               states (name),
               cities (name)
             )
           `)
           .eq('addressee_id', userIdStr)
           .eq('status', 'accepted')
           .in('requester_id', userFollowingIds)
           .order('created_at', { ascending: false });

         if (mutualFriendsError) throw mutualFriendsError;

         // Process friends data
         const processedFriends = (mutualFriendsData || [])
           .filter((friendship: any) => friendship.requester_profiles) // Ensure profile exists
           .map((friendship: any) => {
             const friendUser = friendship.requester_profiles;
             // IMPORTANT: Use the follow_id where current user is the requester
             // This ensures when unfriend is clicked, it removes current user's follow to friend
             const correctFollowId = followingIdMap.get(friendUser.id);
             
             return {
               follow_id: correctFollowId, // Use the correct follow_id (where current user follows friend)
               user_id: friendUser.id,
               username: friendUser.username,
               fullname: friendUser.fullname,
               nickname: friendUser.nickname,
               avatar_url: friendUser.avatar_url,
               last_active: friendUser.last_active,
               is_online: friendUser.last_active && 
                 new Date(friendUser.last_active) > new Date(Date.now() - 15 * 60 * 1000),
               countries: friendUser.countries,
               states: friendUser.states,
               cities: friendUser.cities,
               followed_at: friendship.created_at,
               is_mutual: true,
               is_friend: true
             };
           });

         // Filter by search if provided
         const filteredFriends = search 
           ? processedFriends.filter((user: any) => 
               user.username?.toLowerCase().includes(search.toLowerCase()) ||
               user.fullname?.toLowerCase().includes(search.toLowerCase())
             )
           : processedFriends;

         // Apply pagination to filtered results
         const paginatedFriends = filteredFriends.slice(offset, offset + limit);

         // Total count
         const friendsCount = filteredFriends.length;

         return NextResponse.json({
           data: paginatedFriends,
           pagination: {
             page,
             limit,
             total: friendsCount,
             totalPages: Math.ceil(friendsCount / limit)
           }
         });

       case 'blocked':
        // Get blocked users
        const { data: blockedData, error: blockedError } = await supabase
          .from('friendships')
          .select(`
            id,
            requester_id,
            addressee_id,
            created_at,
            profiles!friendships_addressee_id_fkey (
              id,
              username,
              fullname,
              nickname,
              avatar_url,
              last_active,
              countries (name),
              states (name),
              cities (name)
            )
          `)
          .eq('status', 'blocked')
          .eq('requester_id', userIdStr)
          .range(offset, offset + limit - 1);

        if (blockedError) throw blockedError;

        // Process blocked users
        const processedBlocked = (blockedData || []).map((friendship: any) => ({
          follow_id: friendship.id,
          user_id: friendship.profiles.id,
          username: friendship.profiles.username,
          fullname: friendship.profiles.fullname,
          nickname: friendship.profiles.nickname,
          avatar_url: friendship.profiles.avatar_url,
          last_active: friendship.profiles.last_active,
          is_online: false,
          countries: friendship.profiles.countries,
          states: friendship.profiles.states,
          cities: friendship.profiles.cities,
          blocked_at: friendship.created_at
        }));

        // Filter by search if provided
        const filteredBlocked = search ? processedBlocked.filter((user: any) => 
          user.username?.toLowerCase().includes(search.toLowerCase()) ||
          user.fullname?.toLowerCase().includes(search.toLowerCase())
        ) : processedBlocked;

        // Get total count
        const { count: blockedCount, error: blockedCountError } = await supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'blocked')
          .eq('requester_id', userIdStr);

        if (blockedCountError) throw blockedCountError;

        return NextResponse.json({
          data: filteredBlocked,
          pagination: {
            page,
            limit,
            total: blockedCount || 0,
            totalPages: Math.ceil((blockedCount || 0) / limit)
          }
        });

      default:
        const receivedType = type;
        const receivedNormalized = normalizedType;
        console.error('Invalid type parameter received:', { type: receivedType, normalized: receivedNormalized, userId });
        return NextResponse.json({ 
          error: `Invalid type parameter: "${receivedType}". Valid types: following, followers, friends, blocked, requests_received, requests_sent` 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in follows API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { followerId, followingId } = body;

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: 'Follower ID and Following ID are required' },
        { status: 400 }
      );
    }

    if (followerId === followingId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Get profile.id (XID) from either auth_user_id (UUID) or profiles.id (XID)
    // Frontend sends: followerId = auth_user_id (UUID), followingId = profiles.id (XID)
    
    // Get follower's profile by auth_user_id
    let followerIdStr: string;
    const { data: followerProfile, error: followerError } = await supabase
      .from('profiles')
      .select('id, auth_user_id')
      .eq('auth_user_id', followerId)
      .maybeSingle();

    if (!followerProfile) {
      // Try by id if auth_user_id didn't work
      const { data: followerByIdProfile } = await supabase
        .from('profiles')
        .select('id, auth_user_id')
        .eq('id', followerId)
        .maybeSingle();
      
      if (!followerByIdProfile) {
        console.error('Follower profile not found:', { followerId, error: followerError });
        return NextResponse.json(
          { error: 'Follower profile not found' },
          { status: 404 }
        );
      }
      followerIdStr = followerByIdProfile.id;
    } else {
      followerIdStr = followerProfile.id; // XID
    }

    // Get following user's profile - try by id first (most likely XID from search)
    let followingIdStr: string;
    const { data: followingProfile, error: followingError } = await supabase
      .from('profiles')
      .select('id, auth_user_id')
      .eq('id', followingId)
      .maybeSingle();

    if (!followingProfile) {
      // Try by auth_user_id if id didn't work
      const { data: followingByAuthProfile } = await supabase
        .from('profiles')
        .select('id, auth_user_id')
        .eq('auth_user_id', followingId)
        .maybeSingle();
      
      if (!followingByAuthProfile) {
        console.error('Following profile not found:', { followingId, error: followingError });
        return NextResponse.json(
          { error: 'User to follow not found. The user may not have completed profile setup.' },
          { status: 404 }
        );
      }
      followingIdStr = followingByAuthProfile.id;
    } else {
      followingIdStr = followingProfile.id; // XID
    }

    // Check if already following this specific direction
    const { data: existingFollow, error: checkError } = await supabase
      .from('friendships')
      .select('*')
      .eq('requester_id', followerIdStr)
      .eq('addressee_id', followingIdStr)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingFollow) {
      if (existingFollow.status === 'accepted') {
        return NextResponse.json(
          { error: 'Already following this user' },
          { status: 409 }
        );
      } else if (existingFollow.status === 'pending') {
        return NextResponse.json(
          { error: 'Follow request already sent' },
          { status: 409 }
        );
      } else if (existingFollow.status === 'blocked') {
        return NextResponse.json(
          { error: 'Cannot follow blocked user' },
          { status: 409 }
        );
      }
    }

    // Check if being blocked by the target user
    const { data: blockedBy, error: blockedError } = await supabase
      .from('friendships')
      .select('*')
      .eq('requester_id', followingIdStr)
      .eq('addressee_id', followerIdStr)
      .eq('status', 'blocked')
      .single();

    if (blockedError && blockedError.code !== 'PGRST116') {
      throw blockedError;
    }

    if (blockedBy) {
      return NextResponse.json(
        { error: 'Cannot follow this user' },
        { status: 403 }
      );
    }

     // Check if the target user already follows this user (for mutual detection)
     const { data: reverseFollow, error: reverseCheckError } = await supabase
       .from('friendships')
       .select('*')
       .eq('requester_id', followingIdStr)
       .eq('addressee_id', followerIdStr)
       .eq('status', 'accepted')
       .single();

     if (reverseCheckError && reverseCheckError.code !== 'PGRST116') {
       throw reverseCheckError;
     }

     const isMutual = !!reverseFollow;

     // Use 'accepted' status for all follows (we'll determine friends via logic)
     const followStatus = 'accepted';

     // Create new follow relationship
     const { data, error } = await supabase
       .from('friendships')
       .insert({
         requester_id: followerIdStr,
         addressee_id: followingIdStr,
         status: followStatus
       })
       .select()
       .single();

     if (error) {
       console.error('Error inserting friendship:', error);
       throw error;
     }

     // Note: Friends status is determined by mutual 'accepted' relationships
     // No need to update reverse relationship as we detect friends via logic

     // Create notification for the target user (person being followed)
     // Only save to profiles.notifications JSONB (notification bell reads from here)
     try {
       // Get follower's full profile info for the notification
       const { data: followerFullProfile } = await supabase
         .from('profiles')
         .select('username, fullname, avatar_url')
         .eq('id', followerIdStr)
         .single();

       if (followerFullProfile) {
         const followerName = followerFullProfile.fullname || followerFullProfile.username || 'Someone';
         const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
         const notificationData = {
           follower_id: followerIdStr,
           follower_username: followerFullProfile.username,
           follower_fullname: followerFullProfile.fullname,
           follower_avatar: followerFullProfile.avatar_url,
           is_mutual: isMutual
         };

         // Add to profiles.notifications JSONB for notification bell badge
         const { data: targetProfile } = await supabase
           .from('profiles')
           .select('id, notifications')
           .eq('id', followingIdStr)
           .single();

         if (targetProfile) {
           const currentNotifications = targetProfile.notifications || [];
           const newNotification = {
             id: notificationId,
             type: 'friend_request',
             title: 'Pengikut Baru',
             msg: `${followerName} mulai mengikuti kamu`,
             data: notificationData,
             read: false,
             is_read: false,
             created: new Date().toISOString(),
             created_at: new Date().toISOString()
           };

           // Add new notification at the beginning
           const updatedNotifications = [newNotification, ...currentNotifications].slice(0, 50); // Keep max 50

           await supabase
             .from('profiles')
             .update({ notifications: updatedNotifications })
             .eq('id', followingIdStr);
         }
       }
     } catch (notifError) {
       console.warn('Could not create follow notification:', notifError);
     }

     return NextResponse.json({
       message: isMutual ? 'You are now friends!' : 'Now following user',
       data,
       mutual: isMutual
     });

  } catch (error) {
    console.error('Error creating follow relationship:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
