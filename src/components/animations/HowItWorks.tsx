"use client";

import { useEffect, useRef, useState } from "react";
import { Bug, Wrench, Cpu } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: Bug,
    title: "Hatalı kodu al",
    description: "Her turda sana bir hatalı kod verilir",
  },
  {
    icon: Wrench,
    title: "Düzelt ve gönder",
    description: "Hataları bul, düzelt, bize gönder",
  },
  {
    icon: Cpu,
    title: "AI seni puanlasın",
    description: "Yapay zeka acımasızca puanlar",
  },
];

function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    const card = ref.current;
    if (!card) return;
    card.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: "transform 0.2s ease-out" }}
    >
      {children}
    </div>
  );
}

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    const cards = cardsRef.current.filter(Boolean);
    if (cards.length === 0) return;

    gsap.set(cards, { opacity: 0, y: 60 });

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 75%",
      once: true,
      onEnter: () => {
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.2,
          ease: "power3.out",
        });
        setHasAnimated(true);
      },
    });

    return () => {
      trigger.kill();
    };
  }, [hasAnimated]);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-6 max-w-5xl mx-auto"
    >
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 font-[family-name:var(--font-orbitron)]">
        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Nasıl Çalışır?
        </span>
      </h2>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Dotted connector line (desktop) */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 -translate-y-1/2 z-0">
          <div className="border-t-2 border-dashed border-primary/20 mx-16" />
        </div>

        {steps.map((step, i) => (
          <div
            key={i}
            ref={(el) => {
              cardsRef.current[i] = el;
            }}
            className="relative z-10"
          >
            {/* Step number */}
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-sm font-bold text-primary">
                {i + 1}
              </div>
            </div>

            <TiltCard className="bg-card-bg border border-primary/20 rounded-2xl p-8 text-center cursor-default">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6">
                <step.icon className="w-8 h-8 text-accent" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                {step.title}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                {step.description}
              </p>
            </TiltCard>
          </div>
        ))}
      </div>
    </section>
  );
}
