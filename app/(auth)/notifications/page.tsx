import { generateMeta } from "@/lib/utils";
import NotificationsClientPage from "./component/client";

export async function generateMetadata() {
  return generateMeta({
    title: "Notifications",
    description:
      "Stay updated with your latest notifications, messages, and alerts.",
    canonical: "/notifications"
  });
}

export default function NotificationsPage() {
  return <NotificationsClientPage />;
}
