"use client"

import type React from "react"

import MuxPlayer from "@mux/mux-player-react"
import { motion } from "framer-motion"

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
        autoPlay={autoPlay ? "muted" : false}
        muted={muted}
        loop={loop}
        playsInline
        streamType="on-demand"
        style={
          {
            width: "100%",
            height: "100%",
            objectFit: "cover",
            "--controls": controls ? "flex" : "none",
          } as React.CSSProperties
        }
      />
    </motion.div>
  )
}
