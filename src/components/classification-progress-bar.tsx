"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"

export interface ClassificationEntry {
  timestamp: number
  classification: string
}

interface ClassificationProgressBarProps {
  data: ClassificationEntry[]
  onBarClick: (timestamp: number, classification: string) => void
  className?: string
}

const CLASSIFICATIONS_COLORS = {
    "Correct": "bg-green-500",
    "Flat Fingers": "bg-red-500",
    "High Wrist": "bg-yellow-500",
    "Dropped Wrist": "bg-yellow-500",
    "Collapsed Joints": "bg-red-500",
    "Slouched": "bg-red-500",
    "Head Forward": "bg-yellow-500",
    "Shoulders Raised": "bg-yellow-500",
    "Elbow Dropped": "bg-yellow-500",
    "Elbow Raised": "bg-yellow-500",
}

// Classification color mapping
const getClassificationColor = (classification: string): string => {
  const normalized = classification.toLowerCase()

    for (const [key, color] of Object.entries(CLASSIFICATIONS_COLORS)) {
      if (normalized.includes(key.toLowerCase())) {
        return color
      }
    }

  return "bg-gray-500"
}

export function ClassificationProgressBar({ data, onBarClick, className }: ClassificationProgressBarProps) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    timestamp: number
    classification: string
  }>({
    visible: false,
    x: 0,
    y: 0,
    timestamp: 0,
    classification: "",
  })

  if (!data || data.length === 0) {
    return (
      <div className={cn("h-8 w-full rounded-lg bg-muted", className)}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data</div>
      </div>
    )
  }

  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp)

  // Calculate total duration
  const totalDuration = sortedData[sortedData.length - 1].timestamp

  // Calculate segments with their durations
  const segments = sortedData.map((entry, index) => {
    const startTime = index === 0 ? 0 : sortedData[index - 1].timestamp
    const endTime = entry.timestamp
    const duration = endTime - startTime
    const widthPercentage = (duration / totalDuration) * 100

    return {
      startTime,
      endTime,
      classification: entry.classification,
      widthPercentage,
      color: getClassificationColor(entry.classification),
    }
  })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const relativeX = x / rect.width

    // Calculate timestamp based on mouse position
    const timestamp = relativeX * totalDuration

    // Find which segment this timestamp belongs to
    const segment = segments.find((seg) => timestamp >= seg.startTime && timestamp <= seg.endTime)

    if (segment) {
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        timestamp: Math.round(timestamp * 10) / 10,
        classification: segment.classification,
      })
    }
  }

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const relativeX = x / rect.width

    // Calculate timestamp based on click position
    const timestamp = relativeX * totalDuration

    // Find which segment was clicked
    const segment = segments.find((seg) => timestamp >= seg.startTime && timestamp <= seg.endTime)

    if (segment) {
      onBarClick(timestamp, segment.classification)
    }
  }

  return (
    <>
      <div
        className={cn("relative flex h-8 w-full cursor-pointer overflow-hidden rounded-lg", className)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {segments.map((segment, index) => (
          <div
            key={index}
            className={cn("h-full transition-opacity hover:opacity-90", segment.color)}
            style={{ width: `${segment.widthPercentage}%` }}
          />
        ))}
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="pointer-events-none fixed z-50 rounded-md bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 60}px`,
          }}
        >
          <div className="font-semibold">{tooltip.classification}</div>
          <div className="text-xs text-muted-foreground">{tooltip.timestamp}s</div>
        </div>
      )}
    </>
  )
}
