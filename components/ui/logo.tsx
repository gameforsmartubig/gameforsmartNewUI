import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
    return (
        <div className={cn("flex items-center py-1", className)}>
            <Image
                src="/gameforsmartlogo.png"
                width={140}
                height={40}
                alt="GameForSmart Logo"
                className="h-9 w-auto"
                unoptimized
            />
        </div>
    );
}
