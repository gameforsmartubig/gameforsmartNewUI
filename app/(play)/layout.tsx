import React from "react";

export default function PlayLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use dark background by default to prevent white flash during redirect/countdown
  return <div className="min-h-screen bg-zinc-950">{children}</div>;
}
