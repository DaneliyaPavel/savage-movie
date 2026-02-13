/**
 * Premium Page Transition Component
 * Inspired by freshman.tv - Horizontal curtain wipe with logo reveal
 * 
 * Animation Flow:
 * 1. COVER: Red curtain slides in from right (scaleX: 0 → 1)
 * 2. HOLD: Brief pause with logo visible at full coverage
 * 3. REVEAL: Curtain slides out to left, revealing new page
 */
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <>
            {/* Page Content - No animation, just wrapped for key tracking */}
            <div key={pathname}>
                {children}
            </div>

            {/* Transition Curtain Overlay */}
            <TransitionCurtain key={pathname + '-curtain'} />
        </>
    )
}

function TransitionCurtain() {
    // Respect user's motion preferences
    const shouldReduceMotion = useReducedMotion()

    if (shouldReduceMotion) {
        return null // Skip transition entirely for users who prefer reduced motion
    }

    return (
        <motion.div
            className="fixed inset-0 z-[100] bg-[#FF322E] pointer-events-none flex items-center justify-center overflow-hidden"
            initial={{ x: '100%' }} // Start fully off-screen to the right
            animate={{
                x: [
                    '100%',   // 0ms: Off-screen right
                    '0%',     // 500ms: Fully covers screen
                    '0%',     // 800ms: Hold at full coverage
                    '-100%'   // 1400ms: Slide out to left
                ]
            }}

            transition={{
                duration: 1.4, // Total duration 1.4 seconds (smoother)
                times: [0, 0.36, 0.57, 1], // Timing for each keyframe
                ease: [0.65, 0, 0.35, 1], // Smoother cubic-bezier for gentler motion
            }}
        >
            {/* Logo Container - Visible during hold phase */}
            <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0.85, 1, 1, 0.85]
                }}
                transition={{
                    duration: 1.4,
                    times: [0, 0.4, 0.65, 1], // Fade in during cover, hold, fade out during reveal
                    ease: [0.45, 0, 0.55, 1] // Smoother easing for logo
                }}
                className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center"
            >
                {/* SVG Logo */}
                <Image
                    src="/sm-logo.svg"
                    alt="Savage Movie"
                    width={192}
                    height={192}
                    className="w-full h-full object-contain invert" // Invert to make it white on red
                    priority
                />
            </motion.div>
        </motion.div>
    )
}
