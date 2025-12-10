"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AngleRecommendationsModal } from "@/components/angle-recommendations-modal"
import { Upload, Play, Info, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HandVideoAnalysisResult } from "@/types/hand"
import { parseBodyVideoAnalysisResponse, parseHandVideoAnalysisResponse } from "@/lib/parsings"
import { BodyVideoAnalysisResult } from "@/types/body"
import { ClassificationProgressBar } from "@/components/classification-progress-bar"
import { OverallAnalysis } from '@/components/overall-analysis'
import { Analysis } from '@/types/analysis'

interface VideoAnalyzerProps {
  type: "body" | "hand"
}

export function VideoAnalyzer({ type }: VideoAnalyzerProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [handAnalysisResults, setHandAnalysisResults] = useState<HandVideoAnalysisResult | null>(null)
  const [bodyAnalysisResults, setBodyAnalysisResults] = useState<BodyVideoAnalysisResult[] | null>(null)
  const [overallAnalysis, setOverallAnalysis] = useState<Analysis | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0])
      setHandAnalysisResults(null)
      setUploadProgress(null)
      // clear previous body results when selecting new file
      setBodyAnalysisResults(null)
    }
  }

  // Create object URL for preview and clean up when file changes/unmounts
  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(videoFile)
    setVideoPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
      setVideoPreviewUrl(null)
    }
  }, [videoFile])

  const handleAnalyze = async () => {
    if (!videoFile) return

    setIsAnalyzing(true)
    setUploadProgress(0)

    const url = `http://localhost:8000/${type}/analyze-video`

    const form = new FormData()
    form.append("file", videoFile)

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", url)

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const percent = Math.round((ev.loaded / ev.total) * 100)
            setUploadProgress(percent)
          }
        }

        xhr.onload = () => {
          console.log("Upload complete", xhr)
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText)
              console.log("analyze-video response", json)

              if (type === "hand") {

                const parsed = parseHandVideoAnalysisResponse(json)
                setHandAnalysisResults(parsed)
                summarizeAndRequestOverallFromHand(parsed)
              } else if (type === "body") {

                const parsed = parseBodyVideoAnalysisResponse(json)
                setBodyAnalysisResults(parsed)
                summarizeAndRequestOverallFromBody(parsed)
              }
              
              resolve()
            } catch (err) {
              console.error("Failed to parse response", err)
              reject(err)
            }
          } else {
            console.error("analyze-video failed", xhr.responseText)
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error("Network error during upload"))
        xhr.onabort = () => reject(new Error("Upload aborted"))

        xhr.send(form)
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsAnalyzing(false)
      setUploadProgress(null)
    }
  }

  const buildSummaryFromSegments = (segments: Array<{ classification: string; [k: string]: any }>) => {
    if (!segments || segments.length === 0) return '0% Correct'
    const counts: Record<string, number> = {}
    segments.forEach((s) => {
      const key = s.classification || 'Unknown'
      counts[key] = (counts[key] || 0) + 1
    })
    const total = segments.length
    const parts = Object.entries(counts).map(([cls, cnt]) => `${Math.round((cnt / total) * 100)}% ${cls}`)
    return parts.join(', ')
  }

  const summarizeAndRequestOverallFromHand = async (handResults: HandVideoAnalysisResult) => {
    try {
      setIsSummarizing(true)
      setOverallAnalysis(null)
      const left = (handResults?.leftHand ?? [])
      const right = (handResults?.rightHand ?? [])
      const combined = [...left, ...right]
      const summary = buildSummaryFromSegments(combined)
      await requestOverallAnalysis(summary)
    } catch (err) {
      console.error('Failed to summarize hand results', err)
    } finally {
      setIsSummarizing(false)
    }
  }

  const summarizeAndRequestOverallFromBody = async (bodyResults: BodyVideoAnalysisResult[]) => {
    try {
      setIsSummarizing(true)
      setOverallAnalysis(null)
      const summary = buildSummaryFromSegments(bodyResults ?? [])
      await requestOverallAnalysis(summary)
    } catch (err) {
      console.error('Failed to summarize body results', err)
    } finally {
      setIsSummarizing(false)
    }
  }

  const requestOverallAnalysis = async (summary: string) => {
    try {
      const res = await fetch('/api/gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: summary, type }),
      })
      const json = await res.json()
      if (!res.ok) {
        console.error('Overall analysis endpoint error', json)
        return
      }
      // basic runtime validation
      if (json && json.classification && Array.isArray(json.feedbacks) && Array.isArray(json.materials)) {
        setOverallAnalysis(json as Analysis)
      } else {
        console.error('Invalid overall analysis response', json)
      }
    } catch (err) {
      console.error('Failed to request overall analysis', err)
    }
  }

  const getStatusColor = (status: string) => {
    if (status === "Correct") return "text-emerald-500"
    return "text-amber-500"
  }

  const getStatusIcon = (status: string) => {
    if (status === "Correct") return <CheckCircle2 className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  const handleBarClick = (timestamp: number, _classification: string) => {
    if (videoRef.current) {
      // seek to the timestamp and play for context
      videoRef.current.currentTime = timestamp
      // try to play so the user sees the context; ignore promise
      const p = videoRef.current.play()
      if (p && typeof p.catch === "function") p.catch(() => {})
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {type === "body" ? "Body Posture" : "Hand Posture"} Video Analysis
              </CardTitle>
              <CardDescription className="mt-2">
                Upload a video to analyze your {type === "body" ? "body posture" : "hand positioning"} throughout your
                piano practice session
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={() => setShowModal(true)} className="shrink-0">
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label htmlFor="video-upload" className="cursor-pointer">
                  <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-accent">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        {videoFile ? videoFile.name : "Choose a video file"}
                      </p>
                      <p className="text-sm text-muted-foreground">MP4, MOV, AVI up to 100MB</p>
                    </div>
                  </div>
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <Button onClick={handleAnalyze} disabled={!videoFile || isAnalyzing} size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </Button>
            </div>

            {/* Video preview */}
            {videoPreviewUrl && (
              <div className="mt-4">
                <video
                  ref={videoRef}
                  src={videoPreviewUrl}
                  controls
                  className="w-full max-h-64 rounded-md border border-border bg-black"
                />
              </div>
            )}
            {uploadProgress !== null && (
              <div className="mt-3">
                <div className="h-2 w-full rounded bg-muted/40 overflow-hidden border border-border">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{uploadProgress}%</div>
              </div>
            )}
          </div>

          {/* Results Section */}
          {(handAnalysisResults || bodyAnalysisResults) && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Analysis complete! Review the timeline below to see posture classifications at different timestamps.
                </AlertDescription>
              </Alert>

              {type === "hand" ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="mb-2 text-sm font-medium">Left Hand Timeline</div>
                      <ClassificationProgressBar
                        data={(handAnalysisResults?.leftHand ?? []).map((it) => ({ timestamp: it.timestamp, classification: it.classification }))}
                        onBarClick={handleBarClick}
                      />
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-medium">Right Hand Timeline</div>
                      <ClassificationProgressBar
                        data={(handAnalysisResults?.rightHand ?? []).map((it) => ({ timestamp: it.timestamp, classification: it.classification }))}
                        onBarClick={handleBarClick}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-sm font-medium">Body Timeline</div>
                    <ClassificationProgressBar
                      data={(bodyAnalysisResults ?? []).map((it) => ({ timestamp: it.timestamp, classification: it.classification }))}
                      onBarClick={handleBarClick}
                    />
                  </div>
                </div>
              )}

              {/* Overall analysis */}
              {(overallAnalysis || isSummarizing) && (
                <div className="mt-6">
                  {isSummarizing && <div className="mb-2 text-sm text-muted-foreground">Summarizing results...</div>}
                  {overallAnalysis && <OverallAnalysis {...overallAnalysis} />}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AngleRecommendationsModal open={showModal} onOpenChange={setShowModal} type={type} />
    </>
  )
}
