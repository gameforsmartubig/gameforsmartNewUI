"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from "@/components/ui/sidebar";
import {
  ActivityIcon,
  ArchiveRestoreIcon,
  BadgeDollarSignIcon,
  BrainCircuitIcon,
  BrainIcon,
  Building2Icon,
  CalendarIcon,
  ChartBarDecreasingIcon,
  ChartPieIcon,
  ChevronRight,
  ClipboardCheckIcon,
  ClipboardMinusIcon,
  ComponentIcon,
  CookieIcon,
  FingerprintIcon,
  FolderDotIcon,
  FolderIcon,
  GaugeIcon,
  GraduationCapIcon,
  ImagesIcon,
  KeyIcon,
  MailIcon,
  MessageSquareIcon,
  ProportionsIcon,
  SettingsIcon,
  ShoppingBagIcon,
  SquareCheckIcon,
  SquareKanbanIcon,
  StickyNoteIcon,
  UserIcon,
  UsersIcon,
  WalletMinimalIcon,
  type LucideIcon,
  GithubIcon,
  RedoDotIcon,
  BrushCleaningIcon,
  CreditCardIcon,
  SpeechIcon,
  MessageSquareHeartIcon,
  BookAIcon,
  PuzzleIcon,
  LayoutDashboardIcon,
  HandshakeIcon,
  Users,
  History,
  ChartBar,
  Bell,
  Flag,
  UserCircle2Icon
} from "lucide-react";
import Link from "next/link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NavGroup = {
  title: string;
  items: NavItem;
};

type NavItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  isComing?: boolean;
  isDataBadge?: string;
  isNew?: boolean;
  newTab?: boolean;
  items?: NavItem;
}[];

export const navItems: NavGroup[] = [
  {
    title: "Dashboards",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboardIcon
      },
      {
        title: "Friend",
        href: "/friend",
        icon: HandshakeIcon
      },
      { title: "Group", href: "/group", icon: Users },
      { title: "History", href: "/history", icon: History },
      {
        title: "Evaluation",
        href: "/evaluation",
        icon: ChartBar
      },
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell
      },
      {
        title: "Reports",
        href: "/reports",
        icon: Flag
      },
      {
        title: "Profile",
        href: "/profile",
        icon: UserCircle2Icon
      }
    ]
  }
];

export function NavMain() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <>
      {navItems.map((nav) => (
        <SidebarGroup key={nav.title}>
          {/* <SidebarGroupLabel>{nav.title}</SidebarGroupLabel> */}
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {nav.items.map((item) => {
                // Cek apakah ada sub-item yang sedang aktif
                const isSubItemActive = item.items?.some((sub) => sub.href === pathname);
                const isParentActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.title}>
                    {Array.isArray(item.items) && item.items.length > 0 ? (
                      <>
                        {/* TAMPILAN SAAT SIDEBAR COLLAPSED (ICON ONLY) */}
                        <div className="hidden group-data-[collapsible=icon]:block">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuButton
                                tooltip={item.title}
                                className={`sidebar ${isSubItemActive ? "active" : ""}`}>
                                <div className="relative z-10 flex w-full items-center gap-2">
                                  {item.icon && <item.icon />}
                                  <span>{item.title}</span>
                                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </div>
                              </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              side={isMobile ? "bottom" : "right"}
                              align={isMobile ? "end" : "start"}
                              className="min-w-48 rounded-lg">
                              <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                              {item.items?.map((sub) => (
                                <DropdownMenuItem
                                  key={sub.title}
                                  asChild
                                  className={cn(
                                    "cursor-pointer transition-all duration-200",
                                    pathname === sub.href
                                      ? "sidebar active"
                                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                  )}>
                                  <a href={sub.href} className="relative z-10">
                                    {sub.title}
                                  </a>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* TAMPILAN SAAT SIDEBAR EXPANDED */}
                        <Collapsible
                          className="group/collapsible block group-data-[collapsible=icon]:hidden"
                          defaultOpen={!!item.items.find((s) => s.href === pathname)}>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              className="sidebar transition-all duration-300"
                              tooltip={item.title}>
                              <div className="relative z-10 flex w-full items-center gap-2">
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </div>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item?.items?.map((subItem, key) => (
                                <SidebarMenuSubItem key={key}>
                                  <SidebarMenuSubButton
                                    className={cn(
                                      "sidebar font-semibold transition-all duration-300",
                                      pathname === subItem.href ? "sidebar active" : ""
                                    )}
                                    isActive={pathname === subItem.href}
                                    asChild>
                                    <Link
                                      href={subItem.href}
                                      target={subItem.newTab ? "_blank" : ""}
                                      className="relative z-10">
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </>
                    ) : (
                      /* MENU TUNGGAL (TANPA SUB-MENU) */
                      <SidebarMenuButton
                        className={cn(
                          "sidebar font-semibold transition-all duration-300",
                          isParentActive ? "sidebar active" : ""
                        )}
                        isActive={isParentActive}
                        tooltip={item.title}
                        asChild>
                        <Link
                          href={item.href}
                          target={item.newTab ? "_blank" : ""}
                          className="relative z-10 flex w-full items-center gap-2">
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}

                    {/* BADGE LOGIC */}
                    <div className="pointer-events-none relative z-10">
                      {!!item.isComing && (
                        <SidebarMenuBadge className="peer-hover/menu-button:text-foreground opacity-50">
                          Coming
                        </SidebarMenuBadge>
                      )}
                      {!!item.isNew && (
                        <SidebarMenuBadge className="border border-green-400 text-green-600 peer-hover/menu-button:text-green-600">
                          New
                        </SidebarMenuBadge>
                      )}
                      {!!item.isDataBadge && (
                        <SidebarMenuBadge className="peer-hover/menu-button:text-foreground">
                          {item.isDataBadge}
                        </SidebarMenuBadge>
                      )}
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
