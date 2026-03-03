import { SiteHeader } from "@/components/layout2";
import React from "react";

export default function PlayLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use dark background by default to prevent white flash during redirect/countdown
  return (
    <div>
    <SiteHeader />
    <div className="base-background flex flex-1 flex-col">{children}</div>
    </div>
  );
}
