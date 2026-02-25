type NotificationType = "sessionFriend" | "sessionGroup" | "group" | "admin";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  time: string;
  is_read?: boolean;
  requireAction?: boolean;
}

export const notifications: Notification[] = [
  {
    id: "1",
    title: "New Ticket Assigned",
    description:
      "You have been assigned to ticket #1234 - Website Redesign",
    type: "sessionFriend",
    time: "5 minutes ago",
    is_read: true,
    requireAction: true,
  },
  {
    id: "2",
    title: "Joaquina Weisenborn",
    description: "Requesting access permission",
    type: "group",
    time: "12 pm",
    requireAction: true,
  },
  {
    id: "3",
    title: "New Message",
    description:
      "Sarah Johnson sent you a message in the Website Redesign project",
    type: "admin",
    time: "1 hour ago",
  },
  {
    id: "4",
    title: "Team Update",
    description: "New team member John Smith has joined the project",
    type: "sessionGroup",
    time: "2 hours ago",
    requireAction: true,
  },
];