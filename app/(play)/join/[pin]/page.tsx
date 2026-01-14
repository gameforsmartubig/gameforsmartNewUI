"use client";

  import { useEffect } from "react";
  import { useParams, useRouter } from "next/navigation";

  export default function CodePage() {
    const router = useRouter();
    const params = useParams();
    const pin = params.pin as string;

    useEffect(() => {
      if (!pin) return;
      
      // Simpan kode ke localStorage
      localStorage.setItem("pin", pin);

      // Gunakan replace agar tidak menambah history
      router.replace("/join");
    }, [pin, router]);

    // Biar gak blank, tampilkan placeholder loading ringan
    return (
      null
    );
  }