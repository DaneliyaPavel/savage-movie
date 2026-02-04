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
                    '0%',     // 400ms: Fully covers screen
                    '0%',     // 600ms: Hold at full coverage
                    '-100%'   // 1100ms: Slide out to left
                ]
            }}

            transition={{
                duration: 1.1, // Total duration 1.1 seconds
                times: [0, 0.36, 0.55, 1], // Timing for each keyframe
                ease: [0.76, 0, 0.24, 1], // Premium cubic-bezier (Power3.inOut)
            }}
        >
            {/* Logo Container - Visible during hold phase */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0.8, 1, 1, 0.8]
                }}
                transition={{
                    duration: 1.1,
                    times: [0, 0.45, 0.65, 1], // Fade in during cover, hold, fade out during reveal
                    ease: 'easeInOut'
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
