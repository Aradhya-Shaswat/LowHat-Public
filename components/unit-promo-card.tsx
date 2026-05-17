"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function UnitPromoCard() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % 2);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const content = [
    {
      title: "Operational Unit",
      description: "Form a collective to execute on contracts.",
      linkText: "Create Unit →",
      linkHref: "/create-unit",
    },
    {
      title: "Find a Collective",
      description: "Join an existing unit to start executing.",
      linkText: "Find Units →",
      linkHref: "/find-units",
    },
  ];

  return (
    <div className="mt-4 rounded-md bg-secondary/30 text-left relative overflow-hidden h-[120px]">
      <div 
        className="flex h-full transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(-${slide * 100}%)` }}
      >
        {content.map((item, index) => (
          <div
            key={index}
            className="w-full flex-shrink-0 px-4 py-4 flex flex-col gap-2"
          >
            <h4 className="text-sm font-serif text-foreground">{item.title}</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed tracking-wider h-8">
              {item.description}
            </p>
            <Link 
              href={item.linkHref} 
              className="text-xs font-medium text-foreground hover:underline mt-auto"
            >
              {item.linkText}
            </Link>
          </div>
        ))}
      </div>
      
      {/* Slide indicators */}
      <div className="absolute bottom-3 right-4 flex gap-1">
        {content.map((_, i) => (
          <div 
            key={i}
            className={`w-1 h-1 rounded-full transition-all duration-500 ${slide === i ? 'bg-foreground w-3' : 'bg-foreground/20'}`}
          />
        ))}
      </div>
    </div>
  );
}
