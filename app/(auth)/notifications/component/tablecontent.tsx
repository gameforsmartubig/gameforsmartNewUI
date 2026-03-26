import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ClockIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    if (diff < 3600) return `${Math.floor(diff / 60)} m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    return `${Math.floor(diff / 86400)} d`;
  };

  const renderDescription = (item: any) => {
    if (item.type === "sessionGroup" || item.type === "sessionFriend") {
      return (
        <span className="text-zinc-500 dark:text-zinc-400 text-xs">
          mengundang bergabung di sesi "{item.entity_id?.name}" ({item.entity_id?.application})
        </span>
      );
    }
    if (item.type === "group") {
      return (
        <span className="text-zinc-500 dark:text-zinc-400 text-xs">
          mengundang bergabung ke grup <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.from_group_id?.name}</span>
        </span>
      );
    }
    if (item.type === "admin") {
      return <span className="text-zinc-500 dark:text-zinc-400 text-xs line-clamp-1">{item.content?.message || ""}</span>;
    }
    return <span className="text-zinc-500 dark:text-zinc-400 text-xs">Tindakan diperlukan</span>;
  };

  const renderTitle = (item: any) => {
    if (item.type === "sessionGroup") {
      return (
        <span className="font-bold text-zinc-900 dark:text-zinc-100">
          {item.actor_id} <span className="font-normal text-zinc-500">dari grup</span> {item.from_group_id}
        </span>
      );
    }
    if (item.type === "sessionFriend" || item.type === "group") {
      return <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.actor_id}</span>;
    }
    if (item.type === "admin") {
      return <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.content?.title || "System Notification"}</span>;
    }
    return <span className="font-bold text-zinc-900 dark:text-zinc-100">Pemberitahuan</span>;
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="text-orange-500 mx-auto h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (dbNotifications.length === 0) {
    return (
      <div className="text-zinc-500 p-12 text-center font-medium">Belum ada notifikasi</div>
    );
  }

  return (
    <Table>
      <TableBody>
        {dbNotifications.map((item) => (
          <TableRow
            key={item.id}
            className={cn(
              "transition-all duration-300 group relative overflow-hidden",
              !item.is_read
                ? "bg-orange-50/50 hover:bg-orange-50 dark:bg-orange-950/20 dark:hover:bg-orange-950/30"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
            )}>
            <TableCell className="p-0 w-1">
               <div className={cn(
                 "w-1 h-20 transition-all",
                 !item.is_read ? "bg-orange-500" : "bg-transparent group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"
               )} />
            </TableCell>
            <TableCell className="p-4 align-middle">
              <div className="flex flex-col gap-1">
                <div className="text-sm">
                  {renderTitle(item)}
                </div>
                <div className="text-sm">
                  {renderDescription(item)}
                </div>

                {item.type !== "admin" && (
                  <div className="mt-2 flex items-center gap-2">
                    {item.status === null ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="button-orange h-7 text-[11px] px-4"
                          onClick={() => handleAction(item, "accepted")}
                          disabled={actionLoading === item.id}>
                          {actionLoading === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Terima"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] px-3 font-semibold text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => handleAction(item, "declined")}
                          disabled={actionLoading === item.id}>
                          Tolak
                        </Button>
                      </div>
                    ) : (
                      <span className={cn(
                        "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        item.status === "accepted"
                          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {item.status === "accepted" ? "Diterima" : "Ditolak"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </TableCell>

            {/* Time Column */}
            <TableCell className="p-4 text-right align-middle shrink-0">
               <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                 <ClockIcon className="size-3" /> {getTimeAgo(item.created_at)}
               </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
