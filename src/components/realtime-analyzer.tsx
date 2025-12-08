"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AngleRecommendationsModal } from "@/components/angle-recommendations-modal"
import { Video, VideoOff, Info, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { HandRealtimeAnalysisResponse, HandRealtimeAnalysisResult } from "@/types/hand"
import { parseBodyRealtimeAnalysisResponse, parseHandRealtimeAnalysisResponse } from "@/lib/parsings"
import { BodyRealtimeAnalysisResponse, BodyRealtimeAnalysisResult } from "@/types/body"

interface RealtimeAnalyzerProps {
  type: "body" | "hand"
}

interface AnalysisResponse {
  status: "success" | "error"
  analysis: HandRealtimeAnalysisResponse[] | BodyRealtimeAnalysisResponse
}

export function RealtimeAnalyzer({ type }: RealtimeAnalyzerProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [leftHandAnalysisResults, setLeftHandAnalysisResults] = useState<HandRealtimeAnalysisResult | null>(null)
  const [rightHandAnalysisResults, setRightHandAnalysisResults] = useState<HandRealtimeAnalysisResult | null>(null)
  const [bodyAnalysisResults, setBodyAnalysisResults] = useState<BodyRealtimeAnalysisResult | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const requestRef = useRef<number | undefined>(undefined)
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastSendTime = useRef<number>(0)
  const FPS_LIMIT = 8
  const INTERVAL = 1000 / FPS_LIMIT

  // FOR LOGGIN DATA TODO: REMOVE LATER
  const lastLogTime = useRef<number>(0)
  const LOG_INTERVAL = 5000 // ms

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
    const wsUrl = `ws://localhost:8000/${type}/ws/realtime`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("Connected to analysis server")
      sendFrame()
    }

    ws.onmessage = (event) => {
      try {
        const data: AnalysisResponse = JSON.parse(event.data)

        // FOR LOGGIN DATA TODO: REMOVE LATER
        const now = Date.now()
        if (now - lastLogTime.current >= LOG_INTERVAL) {
          console.log("WebSocket message:", data)
          lastLogTime.current = now
        }


        if (type === "hand") {
          if (!Array.isArray(data.analysis)) {
            console.warn("Expected `data.analysis` to be an array for hand type; got:", data.analysis)
            return
          }
          const analysis = parseHandRealtimeAnalysisResponse(data.analysis)

          if (Array.isArray(analysis)) {
            analysis.forEach((result: HandRealtimeAnalysisResult) => {
              if (result.handedness === "Left") {
                setLeftHandAnalysisResults(result)
              } else if (result.handedness === "Right") {
                setRightHandAnalysisResults(result)
              }
            })
          } else {
            console.warn("Expected `data.analysis` to be an array for hand type; got:", analysis)
          }
        } else if (type === "body") {
          if (Array.isArray(data.analysis)) {
            console.warn("Expected `data.analysis` to be an object for body type; got:", data.analysis)
            return
          }
          const analysis = parseBodyRealtimeAnalysisResponse(data.analysis)
          setBodyAnalysisResults(analysis)
        }
      } catch (error) {
        console.error("Error parsing server message:", error)
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    ws.onclose = () => {
      console.log("WebSocket connection closed")
    }
  }

  const sendFrame = () => {
    if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    // Throttle sending to reduce load
    const now = Date.now()
    if (now - lastSendTime.current < INTERVAL) {
      requestRef.current = requestAnimationFrame(sendFrame)
      return
    }

    if (processingCanvasRef.current) {
      const ctx = processingCanvasRef.current.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        // Send as Blob (binary) to avoid Base64/JSON overhead
        processingCanvasRef.current.toBlob(
          (blob) => {
            if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
              try {
                wsRef.current.send(blob)
                lastSendTime.current = now
              } catch (e) {
                console.error("Failed to send frame blob:", e)
              }
            }
          },
          "image/jpeg",
          0.7
        )
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
    setLeftHandAnalysisResults(null)
    setRightHandAnalysisResults(null)
    setBodyAnalysisResults(null)
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

            {/* Status Overlay: show left hand (top-left) and right hand (top-right) */}
            {isStreaming && type === "hand" && (
              <>
                <div className="absolute left-4 top-4 w-56 p-2 rounded-lg bg-white/80 shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3 w-3" />
                      <span className="text-sm font-semibold">Left Hand</span>
                    </div>
                    <Badge
                      variant={leftHandAnalysisResults?.classification === "Correct" ? "default" : "secondary"}
                      className={leftHandAnalysisResults?.classification === "Correct" ? "bg-emerald-500" : "bg-amber-500"}
                    >
                      {leftHandAnalysisResults?.classification ?? "—"}
                    </Badge>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <div>
                      <strong>Wrist:</strong>{" "}
                      {leftHandAnalysisResults ? `${leftHandAnalysisResults.features.wristAngle.toFixed(1)}°` : "—"}
                    </div>
                    <div>
                      <strong>Avg Finger Curvature:</strong>{" "}
                      {leftHandAnalysisResults
                        ? (
                            leftHandAnalysisResults.features.fingerCurvature.reduce((s, v) => s + v, 0) /
                            Math.max(1, leftHandAnalysisResults.features.fingerCurvature.length)
                          ).toFixed(1) + "°"
                        : "—"}
                    </div>
                    <div>
                      <strong>Avg Joint Angle:</strong>{" "}
                      {leftHandAnalysisResults
                        ? `${(
                            leftHandAnalysisResults.features.fingerJointAngles.reduce((s, v) => s + v, 0) /
                            Math.max(1, leftHandAnalysisResults.features.fingerJointAngles.length)
                          ).toFixed(1)}°`
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="absolute right-4 top-4 w-56 p-2 rounded-lg bg-white/80 shadow text-right">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Right Hand</span>
                    </div>
                    <Badge
                      variant={rightHandAnalysisResults?.classification === "Correct" ? "default" : "secondary"}
                      className={rightHandAnalysisResults?.classification === "Correct" ? "bg-emerald-500" : "bg-amber-500"}
                    >
                      {rightHandAnalysisResults?.classification ?? "—"}
                    </Badge>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <div>
                      <strong>Wrist:</strong>{" "}
                      {rightHandAnalysisResults ? `${rightHandAnalysisResults.features.wristAngle.toFixed(1)}°` : "—"}
                    </div>
                    <div>
                      <strong>Avg Finger Curvature:</strong>{" "}
                      {rightHandAnalysisResults
                        ? (
                            rightHandAnalysisResults.features.fingerCurvature.reduce((s, v) => s + v, 0) /
                            Math.max(1, rightHandAnalysisResults.features.fingerCurvature.length)
                          ).toFixed(1) + "°"
                        : "—"}
                    </div>
                    <div>
                      <strong>Avg Joint Angle:</strong>{" "}
                      {rightHandAnalysisResults
                        ? `${(
                            rightHandAnalysisResults.features.fingerJointAngles.reduce((s, v) => s + v, 0) /
                            Math.max(1, rightHandAnalysisResults.features.fingerJointAngles.length)
                          ).toFixed(1)}°`
                        : "—"}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Body overlay: show live body features and classification */}
            {isStreaming && type === "body" && (
              <div className="absolute left-4 top-4 w-64 p-3 rounded-lg bg-white/80 shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    <span className="text-sm font-semibold">Body Posture</span>
                  </div>
                  <Badge
                    variant={bodyAnalysisResults?.classification === "Correct" ? "default" : "secondary"}
                    className={bodyAnalysisResults?.classification === "Correct" ? "bg-emerald-500" : "bg-amber-500"}
                  >
                    {bodyAnalysisResults?.classification ?? "—"}
                  </Badge>
                </div>

                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <div>
                    <strong>Torso Inclination:</strong>{" "}
                    {bodyAnalysisResults ? `${bodyAnalysisResults.features.torsoInclination.toFixed(1)}°` : "—"}
                  </div>
                  <div>
                    <strong>Neck Angle:</strong>{" "}
                    {bodyAnalysisResults ? `${bodyAnalysisResults.features.neckAngle.toFixed(1)}°` : "—"}
                  </div>
                  <div>
                    <strong>Shoulder Tension:</strong>{" "}
                    {bodyAnalysisResults ? `${bodyAnalysisResults.features.shoulderTension.toFixed(1)}` : "—"}
                  </div>
                  <div>
                    <strong>Elbow Angle:</strong>{" "}
                    {bodyAnalysisResults ? `${bodyAnalysisResults.features.elbowAngle.toFixed(1)}°` : "—"}
                  </div>
                  <div>
                    <strong>Forearm Slope:</strong>{" "}
                    {bodyAnalysisResults ? `${bodyAnalysisResults.features.forearmSlope.toFixed(1)}°` : "—"}
                  </div>
                </div>
              </div>
            )}

            {/* Live badge */}
            {isStreaming && (
              <div className="absolute left-4 bottom-4">
                <Badge variant="default" className="gap-2">
                  <Activity className="h-3 w-3" />
                  Live
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
