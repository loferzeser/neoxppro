import { trpc } from "@/lib/trpc";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: countData } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
  const { data: notifications, refetch } = trpc.notifications.list.useQuery(
    { limit: 10 },
    { enabled: open && isAuthenticated }
  );
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => refetch(),
  });

  if (!isAuthenticated) return null;

  const unread = countData?.count ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unread > 0) markRead.mutate({});
        }}
        className="relative p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#ccff00] text-black text-[9px] font-black flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#111] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
              <span className="text-white font-semibold text-sm">การแจ้งเตือน</span>
              {unread > 0 && (
                <button
                  onClick={() => markRead.mutate({})}
                  className="text-[#ccff00] text-xs hover:underline"
                >
                  อ่านทั้งหมด
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <div className="py-8 text-center text-white/30 text-sm">ไม่มีการแจ้งเตือน</div>
              ) : (
                notifications.map((n) => (
                  <a
                    key={n.id}
                    href={n.link ?? "#"}
                    className={`block px-4 py-3 border-b border-[rgba(255,255,255,0.04)] hover:bg-white/5 transition-all ${!n.isRead ? "bg-[rgba(204,255,0,0.03)]" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#ccff00] shrink-0" />
                      )}
                      <div className={!n.isRead ? "" : "pl-3.5"}>
                        <p className="text-white text-xs font-medium">{n.title}</p>
                        {n.body && <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{n.body}</p>}
                        <p className="text-white/20 text-[10px] mt-1">
                          {new Date(n.createdAt).toLocaleString("th-TH")}
                        </p>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
