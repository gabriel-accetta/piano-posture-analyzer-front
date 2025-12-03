"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AngleRecommendationsModal } from "@/components/angle-recommendations-modal"
import { Upload, Play, Info, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HandVideoAnalysisResult } from "@/types/hand"
import { parseVideoAnalysisResponse } from "@/lib/parsings"

interface VideoAnalyzerProps {
  type: "body" | "hand"
}

export function VideoAnalyzer({ type }: VideoAnalyzerProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [handAnalysisResults, setHandAnalysisResults] = useState<HandVideoAnalysisResult | null>(null)
  const [bodyAnalysisResults, setBodyAnalysisResults] = useState<any | null>(null) // TODO: Define appropriate type for body analysis results

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0])
      setHandAnalysisResults(null)
      setUploadProgress(null)
    }
  }

  const handleAnalyze = async () => {
    if (!videoFile) return

    setIsAnalyzing(true)
    setUploadProgress(0)

    const endpoint = type === "hand" ? "/hand/analyze-video" : "/posture/analyze-video"
    const url = `http://localhost:8000${endpoint}`

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
              console.log("Response JSON:", json)
              const parsed = parseVideoAnalysisResponse(json)
              console.log("Parsed Results:", parsed)

              // TODO: Differentiate between hand and body results
              setHandAnalysisResults(parsed)
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

  const getStatusColor = (status: string) => {
    if (status === "Correct") return "text-emerald-500"
    return "text-amber-500"
  }

  const getStatusIcon = (status: string) => {
    if (status === "Correct") return <CheckCircle2 className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
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
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Right Hand */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Right Hand</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(handAnalysisResults?.rightHand ?? []).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                          >
                            <span className="font-mono text-sm text-muted-foreground">{item.timestamp}s</span>
                            <div className={`flex items-center gap-2 font-medium ${getStatusColor(item.classification)}`}>
                              {getStatusIcon(item.classification)}
                              {item.classification}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Left Hand */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Left Hand</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(handAnalysisResults?.leftHand ?? []).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                          >
                            <span className="font-mono text-sm text-muted-foreground">{item.timestamp}s</span>
                            <div className={`flex items-center gap-2 font-medium ${getStatusColor(item.classification)}`}>
                              {getStatusIcon(item.classification)}
                              {item.classification}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Body Posture Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(bodyAnalysisResults?.body_posture_classification as any ?? []).map(
                        ([timestamp, status]: [number, string], idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                          >
                            <span className="font-mono text-sm text-muted-foreground">{timestamp}s</span>
                            <div className={`flex items-center gap-2 font-medium ${getStatusColor(status)}`}>
                              {getStatusIcon(status)}
                              {status}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AngleRecommendationsModal open={showModal} onOpenChange={setShowModal} type={type} />
    </>
  )
}
