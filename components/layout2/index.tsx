"use client";

import { PanelLeftIcon } from "lucide-react";

import UserMenu from "@/components/layout2/user-menu";
import Logo from "./logo";
import { useRouter } from "next/navigation";

export function SiteHeader() {
  const router = useRouter();

  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] dark:bg-zinc-950">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 py-2">
        <div className="h-10 flex items-center cursor-pointer" onClick={() => router.push("/dashboard")}>
          <Logo />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
