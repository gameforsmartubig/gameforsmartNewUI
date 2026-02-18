import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { generateMeta } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export async function generateMetadata() {
  return generateMeta({
    title: "404 Page",
    description:
      "This is an example of a template for 404 error pages. Built with shadcn/ui, Tailwind CSS and Next.js.",
    canonical: "/pages/error/404"
  });
}

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-yellow-50/50 p-4">
      <div className="w-full max-w-3xl space-y-4 lg:space-y-8">
        {/* Container Visual 404 */}
        <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-3xl border border-orange-100 bg-white/50 shadow-2xl shadow-orange-100 backdrop-blur-sm sm:h-80">
          {/* Background Grid - Diubah ke Orange/Kuning */}
          <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-20">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="border-[0.5px] border-orange-200"
                style={{
                  opacity: Math.random() * 0.5 + 0.3
                }}
              />
            ))}
          </div>

          {/* Elemen Dekoratif Hijau (Aksen Smart/Game) */}
          <div className="absolute top-4 left-4 flex gap-1">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
            <div className="h-2 w-2 rounded-full bg-orange-400"></div>
            <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
          </div>

          <div className="relative z-10 text-center">
            {/* Angka 404 Dominan Orange dengan Shadow Kuning */}
            <div className="mb-2 text-8xl font-black tracking-tighter text-orange-500 drop-shadow-[0_10px_10px_rgba(249,115,22,0.2)] sm:text-9xl">
              404
            </div>
            <div className="text-xl font-bold tracking-wide text-orange-900 uppercase sm:text-2xl">
              Oops! Page Not Found
            </div>
            <p className="mt-2 text-sm text-gray-500">Sepertinya Anda tersesat di labirin game.</p>
          </div>

          {/* Gradient Overlay bawah */}
          <div className="absolute right-0 bottom-0 left-0 h-1/3 bg-gradient-to-t from-white/80 to-transparent" />
        </div>

        {/* Tombol Back to Home */}
        <div className="flex justify-center">
          <Button
            asChild
            size="lg"
            className="group rounded-2xl border-none bg-orange-500 px-8 py-6 text-white shadow-lg shadow-orange-200 transition-all hover:scale-105 hover:bg-orange-600 active:scale-95">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold tracking-wide">BACK TO HOME</span>
              <ArrowRight className="h-5 w-5 text-yellow-300 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
