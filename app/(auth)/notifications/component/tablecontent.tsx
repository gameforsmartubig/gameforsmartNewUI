import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ClockIcon, Loader2 } from "lucide-react";

interface TableContentProps {
  dbNotifications: any[];
  loading: boolean;
  actionLoading: string | null;
  handleAction: (item: any, action: "accepted" | "declined") => void;
}

export default function TableContent({
  dbNotifications,
  loading,
  actionLoading,
  handleAction
}: TableContentProps) {
  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `Just now`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const renderDescription = (item: any) => {
    if (item.type === "sessionGroup" || item.type === "sessionFriend") {
      return (
        <span className="text-muted-foreground text-sm">
          to join session "{item.entity_id?.name}" on application {item.entity_id?.application}
        </span>
      );
    }
    if (item.type === "group") {
      return (
        <span className="text-muted-foreground text-sm">
          to join group {item.from_group_id?.name}
        </span>
      );
    }
    if (item.type === "admin") {
      return <span className="text-muted-foreground text-sm">{item.content?.message || ""}</span>;
    }
    return <span className="text-muted-foreground text-sm">Action Required</span>;
  };

  const renderTitle = (item: any) => {
    if (item.type === "sessionGroup") {
      return `${item.actor_id} invite you from group ${item.from_group_id}`;
    }
    if (item.type === "sessionFriend" || item.type === "group") {
      return `${item.actor_id} invite you`;
    }
    if (item.type === "admin") {
      return item.content?.title || "System Notification";
    }
    return "Notification";
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (dbNotifications.length === 0) {
    return (
      <div className="text-muted-foreground p-10 text-center">Tidak ada notifikasi ditemukan</div>
    );
  }

  return (
    <Table>
      <TableBody>
        {dbNotifications.map((item) => (
          <TableRow
            key={item.id}
            className={`transition-colors ${
              !item.is_read ? " bg-orange-50 dark:bg-amber-950/50" : ""
            }`}>
            {/* Content Column */}
            <TableCell className="p-4 align-middle">
              <div className="space-y-3 rounded-md">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {renderTitle(item)}
                    </div>

                    <div className="text-sm">{renderDescription(item)}</div>

                    {item.type !== "admin" && (
                      <div className="mt-3 flex gap-2">
                        {item.status === null ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(item, "accepted")}
                              disabled={actionLoading === item.id}>
                              {actionLoading === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Accept"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(item, "declined")}
                              disabled={actionLoading === item.id}>
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold tracking-wider uppercase ${
                                item.status === "accepted"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}>
                              {item.status === "accepted" ? "Accepted" : "Declined"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TableCell>

            {/* Time Column */}
            <TableCell className="text-muted-foreground text-right text-sm">
              <span className="flex items-center justify-end gap-1">
                <ClockIcon className="size-3" /> {getTimeAgo(item.created_at)}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
