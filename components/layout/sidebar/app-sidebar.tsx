"use client";

import * as React from "react";
import { useEffect } from "react";
import { ChevronsUpDown, ShoppingBagIcon, UserCircle2Icon } from "lucide-react";
import { PlusIcon } from "@radix-ui/react-icons";
import { usePathname } from "next/navigation";
import { useIsTablet } from "@/hooks/use-mobile";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/layout/sidebar/nav-main";
import { NavUser } from "@/components/layout/sidebar/nav-user";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const isTablet = useIsTablet();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname]);

  useEffect(() => {
    setOpen(!isTablet);
  }, [isTablet]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
                <div className="h-10 group-data-[collapsible=icon]:px-0!">
                  <Image
                        src="/logo.png"
                        width={100}
                        height={40}
                        className="hidden ml-1 group-data-[collapsible=icon]:block group-data-[collapsible=icon]:size-8"
                        alt="gameforsmart logo"
                        unoptimized
                      />
                  <Image
                        src="/gameforsmartlogo.png"
                        width={100}
                        height={40}
                        className="w-full ml-1 group-data-[collapsible=icon]:hidden"
                        alt="gameforsmart logo"
                        unoptimized
                      />
                </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          <NavMain />
        </ScrollArea>
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser />
      </SidebarFooter> */}
    </Sidebar>
  );
}
