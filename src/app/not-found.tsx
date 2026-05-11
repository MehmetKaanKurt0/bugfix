import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="text-center">
        <Image
          src="/logo.png"
          alt="BT"
          width={48}
          height={48}
          className="w-12 h-12 object-contain mx-auto mb-6 opacity-40"
        />
        <h1
          className="text-7xl md:text-9xl font-bold font-[family-name:var(--font-orbitron)] tracking-wider"
          style={{
            textShadow: "0 0 30px rgba(79,70,229,0.4), 0 0 60px rgba(124,58,237,0.2)",
          }}
        >
          404
        </h1>
        <p className="mt-4 text-white/40 text-lg font-[family-name:var(--font-orbitron)]">
          Kod bulunamadı
        </p>
        <p className="mt-2 text-white/25 text-sm">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link
          href="/"
          className="inline-block mt-8 px-6 py-3 rounded-xl text-sm font-semibold text-white
            bg-gradient-to-r from-primary to-secondary
            hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-[1.02] active:scale-[0.98]
            transition-all duration-200"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </main>
  );
}
