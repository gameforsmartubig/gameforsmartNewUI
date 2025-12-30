// Global event system for friends updates
type FriendsEventType = 'friend_added' | 'friend_removed' | 'friend_blocked' | 'friend_unblocked' | 'request_accepted' | 'request_declined';

interface FriendsEvent {
  type: FriendsEventType;
  userId: string;
  friendId?: string;
  timestamp: number;
}

class FriendsEventEmitter {
  private listeners: Map<FriendsEventType, Array<(event: FriendsEvent) => void>> = new Map();

  on(eventType: FriendsEventType, callback: (event: FriendsEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(eventType: FriendsEventType, userId: string, friendId?: string) {
    const event: FriendsEvent = {
      type: eventType,
      userId,
      friendId,
      timestamp: Date.now(),
    };

    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in friends event callback:', error);
        }
      });
    }

    // Also emit to 'any' listeners
    const anyCallbacks = this.listeners.get('friend_added' as FriendsEventType);
    // We can extend this for global listeners if needed
  }

  removeAllListeners(eventType?: FriendsEventType) {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Global instance
export const friendsEvents = new FriendsEventEmitter();

// Helper functions to emit common events
export const emitFriendAdded = (userId: string, friendId: string) => {
  friendsEvents.emit('friend_added', userId, friendId);
};

export const emitFriendRemoved = (userId: string, friendId: string) => {
  friendsEvents.emit('friend_removed', userId, friendId);
};

export const emitFriendBlocked = (userId: string, friendId: string) => {
  friendsEvents.emit('friend_blocked', userId, friendId);
};

export const emitFriendUnblocked = (userId: string, friendId: string) => {
  friendsEvents.emit('friend_unblocked', userId, friendId);
};

export const emitRequestAccepted = (userId: string, friendId: string) => {
  friendsEvents.emit('request_accepted', userId, friendId);
};

export const emitRequestDeclined = (userId: string, friendId: string) => {
  friendsEvents.emit('request_declined', userId, friendId);
};
