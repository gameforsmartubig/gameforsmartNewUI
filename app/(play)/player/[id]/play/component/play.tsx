import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flag, Timer } from "lucide-react";
import Image from "next/image";

export default function Play() {
  return (
    <div className="min-h-screen w-full bg-rose-50">
      <div className="relative flex h-auto w-full flex-col items-center md:h-16 md:flex-row">
        {/* ===== BARIS 1 (Mobile) / KIRI (Desktop) ===== */}
        <div className="flex w-full items-center justify-between px-2 py-2 md:flex-1 md:justify-start md:py-0">
          <Image
            src="/gameforsmartlogo.png"
            width={200}
            height={40}
            alt="gameforsmart"
            className="opacity-80 dark:opacity-100"
            unoptimized
          />

          {/* End Session (Mobile only) */}
          <div className="md:hidden flex items-center gap-2 font-semibold rounded-lg bg-purple-100 py-2 px-4"><Timer/> 12:23</div>
        </div>

        {/* ===== STATISTIK (Baris 2 Mobile / Tengah Desktop) ===== */}
        <div className="flex w-full flex-col items-center justify-center gap-2 px-6 py-2 md:flex-1 md:py-0">
          <div className="flex w-full items-center justify-between">
            <p>Progress</p>
            <p>1/10</p>
          </div>
          <Progress indicatorColor="bg-blue-500" value={50} className="w-full" />
        </div>

        {/* ===== KANAN DESKTOP ===== */}
        <div className="hidden items-center justify-end px-2 md:flex md:flex-1">
            <div className="flex items-center gap-2 font-semibold rounded-lg bg-purple-100 py-2 px-4 ">
                <Timer/> 12:23
            </div> 
        </div>
      </div>
      <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_320px]">
        {/* KIRI: Soal + Jawaban */}
        <div className="order-1 flex flex-col space-y-4 overflow-y-auto p-4">
          {/* Soal */}
          <Card className="py-4">
            <CardContent className="bg-surface-light dark:bg-surface-dark rounded-lg px-4">
              <div className="flex items-center justify-between">
                <h1 className="mb-2 text-xl font-semibold">Question 1</h1>
                <Button variant="outline"><Flag /> Flag</Button>
              </div>
              <p>Berapakah hasil dari 10 + 5 × 2?</p>
            </CardContent>
          </Card>

          {/* Pilihan Jawaban */}
          <section className="grid grid-cols-2 gap-3">
            {["A. 20", "B. 30", "C. 25", "D. 40"].map((item) => (
              <div
                key="{item}"
                className="hover:bg-muted flex w-full cursor-pointer gap-2 rounded-lg border bg-white p-4 text-left transition">
                {item.split(".")[0]}.
                <div className="flex flex-col">
                  {item.split(".")[1]}
                  <Image
                    src="/gameforsmartlogo.png"
                    width={200}
                    height={40}
                    alt="gameforsmart"
                    className="opacity-80 dark:opacity-100"
                    unoptimized
                  />
                </div>
              </div>
            ))}
          </section>
          <div className="flex justify-between">
            <Button variant="outline">Previous</Button>
            <Button variant="outline">Next</Button>
          </div>
        </div>

        {/* KANAN / BAWAH: Nav Soal */}
        <aside className="order-2 p-4 lg:order-2 lg:pl-0">
          <Card className="py-4">
            <CardContent className="sticky bottom-0 px-4 lg:top-0">
              <p className="mb-3 font-semibold">Question Navigation</p>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(44px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(48px,1fr))] lg:grid-cols-5">
                {/* <div className="flex flex-wrap gap-2"> */}
                {Array.from({ length: 50 }).map((_, i) => (
                  <button
                    key="{i}"
                    className="hover:bg-muted aspect-square rounded-md border text-sm transition cursor-pointer">
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="space-y-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-primary size-4 rounded-sm"></div>
                  <span className="text-slate-600 dark:text-slate-400">Current Question</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="size-4 rounded-sm bg-green-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">Answered</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="size-4 rounded-sm bg-amber-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">Flagged</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="size-4 rounded-sm bg-slate-200 dark:bg-slate-800"></div>
                  <span className="text-slate-600 dark:text-slate-400">Not Answered</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
