"use client";

import { motion } from "framer-motion";

interface LogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function MetaGenLogo({ size = 42, className = "", animate = true }: LogoProps) {
  return (
    <div 
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Ambient Pulse Glow */}
      <div 
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary via-cyan-500 to-blue-600 blur-md opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500"
      />

      <svg 
        viewBox="0 0 512 512" 
        width={size} 
        height={size} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-lg"
      >
        <defs>
          <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0F172A"/>
            <stop offset="50%" stop-color="#090D16"/>
            <stop offset="100%" stop-color="#030712"/>
          </linearGradient>

          <linearGradient id="logoRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.8"/>
            <stop offset="50%" stop-color="#1E293B" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.6"/>
          </linearGradient>

          <linearGradient id="logoLeftWing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38BDF8"/>
            <stop offset="100%" stop-color="#1D4ED8"/>
          </linearGradient>

          <linearGradient id="logoRightWing" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#60A5FA"/>
            <stop offset="100%" stop-color="#1E40AF"/>
          </linearGradient>

          <linearGradient id="logoPlayPrism" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#22D3EE"/>
            <stop offset="50%" stop-color="#38BDF8"/>
            <stop offset="100%" stop-color="#2563EB"/>
          </linearGradient>

          <filter id="logoCoreGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        {/* Squircle Base */}
        <rect 
          x="24" 
          y="24" 
          width="464" 
          height="464" 
          rx="116" 
          fill="url(#logoBgGrad)" 
          stroke="url(#logoRimGrad)" 
          strokeWidth="8"
        />

        {/* Background Light Aura */}
        <circle cx="256" cy="256" r="130" fill="#2563EB" opacity="0.18" filter="url(#logoCoreGlow)"/>

        {/* Left Facet Wing */}
        <path d="M 112 368 L 112 172 L 200 256 L 200 368 Z" fill="url(#logoLeftWing)" />

        {/* Right Facet Wing */}
        <path d="M 400 368 L 400 172 L 312 256 L 312 368 Z" fill="url(#logoRightWing)" />

        {/* Central Quantum Play Prism (▶) */}
        <path d="M 200 172 L 344 256 L 200 340 Z" fill="url(#logoPlayPrism)" filter="url(#logoCoreGlow)" />

        {/* Refraction Top Chevrons */}
        <path 
          d="M 112 172 L 256 108 L 400 172" 
          stroke="#67E8F9" 
          strokeWidth="14" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          opacity="0.95"
        />
        <path d="M 256 108 L 256 256" stroke="#A5F3FC" strokeWidth="4" strokeLinecap="round" opacity="0.5"/>

        {/* Apex Spark Node */}
        <circle cx="256" cy="108" r="16" fill="#FFFFFF" filter="url(#logoCoreGlow)"/>
        <circle cx="256" cy="108" r="8" fill="#38BDF8"/>
      </svg>
    </div>
  );
}
