import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="background-base grid h-screen items-center pb-8 lg:grid-cols-2 lg:pb-0">
      <div className="text-center">
        <p className="text-base font-semibold text-orange-600 dark:text-orange-500">404</p>
        <h1 className="dark:text-yellow-50000 mt-4 text-3xl font-bold tracking-tight text-yellow-600 md:text-5xl lg:text-7xl">
          Page Not Found
        </h1>
        <p className="mt-6 text-base leading-7 text-orange-800/70 dark:text-orange-300">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-2">
          <Button size="lg" asChild className="button-orange">
            <Link href="/dashboard">Go Back Home</Link>
          </Button>
          <Button size="lg" variant="ghost" className="button-green-outline">
            Contact Support{" "}
            <ArrowRight className="ms-2 h-4 w-4 text-yellow-500 hover:text-zinc-950" />
          </Button>
        </div>
      </div>
      <div className="hidden lg:block">
        <img
          src={`/404.svg`}
          width={300}
          height={400}
          className="w-full object-contain lg:max-w-2xl"
          alt="not found image"
        />
      </div>
    </div>
  );
}
