"use client"

import type React from "react"

import MuxPlayer from "@mux/mux-player-react"
import { motion } from "framer-motion"

type MuxStyle = React.CSSProperties & Record<`--${string}`, string>

interface VideoPlayerProps {
  playbackId: string
  poster?: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
}

export function VideoPlayer({
  playbackId,
  poster,
  className = "",
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
}: VideoPlayerProps) {
  const effectiveMuted = autoPlay ? true : muted

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={`relative overflow-hidden ${className}`}
    >
      <MuxPlayer
        playbackId={playbackId}
        poster={poster}
        autoPlay={autoPlay}
        muted={effectiveMuted}
        loop={loop}
        playsInline
        streamType="on-demand"
        className="absolute inset-0 w-full h-full"
        style={
          {
            width: "100%",
            height: "100%",
            // Mux Player uses CSS custom properties for the internal media element.
            // Setting these avoids letterboxing/pillarboxing and makes the video truly fullscreen.
            "--media-object-fit": "cover",
            "--media-object-position": "center",
            "--controls": controls ? "flex" : "none",
          } as MuxStyle
        }
      />
    </motion.div>
  )
}
