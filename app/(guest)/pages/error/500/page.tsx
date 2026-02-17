import { Button } from "@/components/ui/button";
import { generateMeta } from "@/lib/utils";
import Link from "next/link";

export async function generateMetadata() {
  return generateMeta({
    title: "500 Page",
    description:
      "This is an example of a template for 500 error pages. Built with shadcn/ui, Tailwind CSS and Next.js.",
    canonical: "/pages/error/500"
  });
}

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-yellow-50/50 p-4">
      <div className="w-full max-w-3xl space-y-4 lg:space-y-8">
        {/* Container Visual 500 */}
        <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-3xl border border-orange-200 bg-white/60 shadow-2xl shadow-orange-100/50 backdrop-blur-md sm:h-80">
          {/* Background Grid - Warna Orange/Kuning lembut */}
          <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-20">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="border-[0.5px] border-orange-300"
                style={{
                  opacity: Math.random() * 0.5 + 0.3
                }}
              />
            ))}
          </div>

          {/* Indikator Status "Smart" - Aksen Hijau */}
          <div className="absolute top-6 right-6 flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-orange-400 uppercase">
              System Status:
            </span>
            <div className="h-3 w-3 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          </div>

          <div className="relative z-10 text-center">
            {/* Angka 500 Dominan Orange */}
            <div className="mb-2 text-8xl font-black tracking-tighter text-orange-600 drop-shadow-md sm:text-9xl">
              500
            </div>
            <div className="text-xl font-bold tracking-tight text-orange-900 uppercase italic sm:text-2xl">
              Server Error
            </div>
            <p className="mx-auto mt-2 max-w-xs text-sm text-gray-500">
              Ups! Terjadi gangguan teknis pada mesin game kami. Kami akan segera memperbaikinya.
            </p>
          </div>

          {/* Decorative Yellow Flare */}
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-yellow-200/30 blur-3xl" />

          {/* Gradient Overlay bawah */}
          <div className="absolute right-0 bottom-0 left-0 h-1/3 bg-gradient-to-t from-white/90 to-transparent" />
        </div>

        {/* Tombol Aksi - Konsisten dengan tema */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-orange-500 px-8 py-6 font-bold text-white shadow-lg shadow-orange-200 transition-all hover:scale-105 hover:bg-orange-600 active:scale-95">
            Coba Lagi
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-2xl border-2 border-yellow-400 px-8 py-6 text-orange-700 transition-all hover:bg-yellow-50">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
