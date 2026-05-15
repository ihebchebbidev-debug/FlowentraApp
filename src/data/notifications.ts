export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string; // e.g., "2h ago"
  read: boolean;
  type?: "info" | "warning" | "success" | "message";
};

export const notifications: NotificationItem[] = [
  {
    id: "1",
    title: "New lead assigned",
    description: "A new lead was assigned to you: Acme Corp.",
    time: "2m ago",
    read: false,
    type: "info",
  },
  {
    id: "2",
    title: "Deal moved to Negotiation",
    description: "Q3 Expansion - Contoso Ltd.",
    time: "1h ago",
    read: false,
    type: "success",
  },
  {
    id: "3",
    title: "Task due today",
    description: "Follow up with Globex on proposal.",
    time: "3h ago",
    read: true,
    type: "warning",
  },
  {
    id: "4",
    title: "New message",
    description: "Jane Cooper replied to your email.",
    time: "Yesterday",
    read: true,
    type: "message",
  },
  {
    id: "5",
    title: "System update",
    description: "Analytics module received new insights.",
    time: "2d ago",
    read: true,
    type: "info",
  },
];
