"use client";

import { PanelLeftIcon } from "lucide-react";

import UserMenu from "@/components/layout2/user-menu";
import Logo from "./logo";
import { useRouter } from "next/navigation";

export function SiteHeader() {
  const router = useRouter();

  return (
    <header className=" bg-background/40 sticky top-0 z-50 flex items-center h-(--header-height) shrink-0 gap-2 border-b backdrop-blur-md transition-[width,height] dark:bg-zinc-950">
      <div className="box-content flex w-full items-center gap-1 px-4 max-w-6xl mx-auto lg:gap-2 py-2">
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
