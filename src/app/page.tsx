import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import HowItWorks from "@/components/animations/HowItWorks";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, rgba(79,70,229,0.12) 0%, rgba(124,58,237,0.06) 40%, #0B0D1A 70%)",
      }}
    />
  ),
});

export default function Home() {
  return (
    <main className="bg-dark-bg">
      {/* HERO */}
      <section className="relative h-screen w-full overflow-hidden">
        <HeroScene />

        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          {/* Logo */}
          <div className="relative mb-6" style={{ filter: "drop-shadow(0 0 24px rgba(79,70,229,0.5)) drop-shadow(0 0 48px rgba(124,58,237,0.3))" }}>
            <Image
              src="/logo.png"
              alt="Bilgisayar Topluluğu"
              width={80}
              height={80}
              priority
              className="w-[60px] h-[60px] md:w-20 md:h-20 object-contain"
            />
          </div>

          {/* Title */}
          <h1
            className="text-4xl md:text-7xl lg:text-8xl font-bold tracking-[0.2em] font-[family-name:var(--font-orbitron)]"
            style={{
              textShadow:
                "0 0 20px rgba(79,70,229,0.6), 0 0 40px rgba(124,58,237,0.4), 0 0 80px rgba(6,182,212,0.2)",
            }}
          >
            BUGFIX
          </h1>

          {/* Slogan */}
          <p className="mt-4 text-base md:text-lg text-white/60 tracking-wide text-center px-4 font-[family-name:var(--font-orbitron)] font-light">
            Kodu düzelt. Rakiplerini ez. Zirveye çık.
          </p>

          {/* Badge */}
          <div className="mt-6 px-5 py-2 rounded-full text-xs md:text-sm text-primary/80 bg-primary/10 border border-primary/30">
            Bilgisayar Topluluğu Etkinliği
          </div>

          {/* CTA */}
          <Link
            href="/leaderboard"
            className="pointer-events-auto mt-8 px-8 py-3 rounded-xl font-semibold text-white text-sm
              bg-gradient-to-r from-primary to-secondary
              hover:shadow-[0_0_24px_rgba(79,70,229,0.5)] hover:scale-105 active:scale-[0.98]
              transition-all duration-300"
          >
            Sıralamayı Gör
          </Link>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 animate-bounce text-white/30">
            <ChevronDown className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#080A14] py-10">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo.png"
            alt="BT Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-contain opacity-60"
          />
          <p className="text-white/40 text-sm">
            Bilgisayar Topluluğu tarafından düzenlenmektedir
          </p>
        </div>
      </footer>
    </main>
  );
}
