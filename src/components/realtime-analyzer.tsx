"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AngleRecommendationsModal } from "@/components/angle-recommendations-modal"
import { Video, VideoOff, Info, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface RealtimeAnalyzerProps {
  type: "body" | "hand"
}

export function RealtimeAnalyzer({ type }: RealtimeAnalyzerProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string>("Ready to analyze")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const requestRef = useRef<number | undefined>(undefined)
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    return () => {
      stopStreaming()
    }
  }, [])

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current && canvasRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth
            canvasRef.current.height = videoRef.current.videoHeight
            
            // Initialize processing canvas
            if (!processingCanvasRef.current) {
              processingCanvasRef.current = document.createElement('canvas')
            }
            processingCanvasRef.current.width = videoRef.current.videoWidth
            processingCanvasRef.current.height = videoRef.current.videoHeight
          }
          setIsStreaming(true)
          connectWebSocket()
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const connectWebSocket = () => {
    // Connect to Python API WebSocket endpoint
    const wsUrl = `ws://localhost:8000/ws/${type}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("Connected to analysis server")
      sendFrame()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Handle processed frame
        if (data.frame && canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d")
          const img = new Image()
          img.onload = () => {
            ctx?.drawImage(img, 0, 0)
          }
          img.src = `data:image/jpeg;base64,${data.frame}`
        }

        // Handle status updates
        if (data.status) {
          setCurrentStatus(data.status)
        }
      } catch (error) {
        console.error("Error parsing server message:", error)
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      // Could show a toast or error state here
    }

    ws.onclose = () => {
      console.log("WebSocket connection closed")
    }
  }

  const sendFrame = () => {
    if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    if (processingCanvasRef.current) {
      const ctx = processingCanvasRef.current.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        // Convert frame to base64
        const base64Data = processingCanvasRef.current.toDataURL("image/jpeg", 0.6)
        
        // Send to server
        wsRef.current.send(JSON.stringify({
          image: base64Data.split(",")[1], // Remove data URL prefix
          timestamp: Date.now()
        }))
      }
    }

    // Schedule next frame
    requestRef.current = requestAnimationFrame(sendFrame)
  }

  const stopStreaming = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }

    setIsStreaming(false)
    setCurrentStatus("Ready to analyze")
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {type === "body" ? "Body Posture" : "Hand Posture"} Realtime Analysis
              </CardTitle>
              <CardDescription className="mt-2">
                Get instant feedback on your {type === "body" ? "body posture" : "hand positioning"} as you play
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={() => setShowModal(true)} className="shrink-0">
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video Feed */}
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Camera not active</p>
                </div>
              </div>
            )}

            {/* Status Overlay */}
            {isStreaming && (
              <div className="absolute left-4 top-4 flex gap-2">
                <Badge variant="default" className="gap-2">
                  <Activity className="h-3 w-3" />
                  Live
                </Badge>
                <Badge
                  variant={currentStatus === "Correct" ? "default" : "secondary"}
                  className={currentStatus === "Correct" ? "bg-emerald-500" : "bg-amber-500"}
                >
                  {currentStatus}
                </Badge>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isStreaming ? (
              <Button onClick={startStreaming} size="lg" className="gap-2">
                <Video className="h-4 w-4" />
                Start Camera
              </Button>
            ) : (
              <Button onClick={stopStreaming} variant="destructive" size="lg" className="gap-2">
                <VideoOff className="h-4 w-4" />
                Stop Camera
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AngleRecommendationsModal open={showModal} onOpenChange={setShowModal} type={type} />
    </>
  )
}
