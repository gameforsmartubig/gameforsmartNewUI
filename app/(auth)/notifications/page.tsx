import { generateMeta } from "@/lib/utils";
import NotificationsClientPage from "./component/client";

export async function generateMetadata() {
  return generateMeta({
    title: "Notifications",
    description:
      "Stay updated with your latest notifications, messages, and alerts in the Game For Smart ecosystem. Built with Next.js.",
    canonical: "/notifications"
  });
}

export default function NotificationsPage() {
  return <NotificationsClientPage />;
}
