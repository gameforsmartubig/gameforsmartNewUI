"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import Notifications from "@/components/layout/header/notifications";
import ThemeSwitch from "@/components/layout/header/theme-switch";
import UserMenu from "@/components/layout/header/user-menu";

export function SiteHeader() {
  const router = useRouter();

  return (
    <header className="bg-background/80 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-all ease-linear dark:bg-zinc-950/80">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <div
          className="flex h-14 items-center cursor-pointer px-1"
          onClick={() => router.push("/dashboard")}
        >
          <Image
            src="/gameforsmartlogo.png"
            width={240}
            height={80}
            className="w-[180px] h-auto object-contain dark:brightness-110"
            alt="gameforsmart logo"
            unoptimized
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Notifications />
          <ThemeSwitch />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
