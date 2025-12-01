"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AngleRecommendationsModal } from "@/components/angle-recommendations-modal"
import { Upload, Play, Info, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VideoAnalyzerProps {
  type: "body" | "hand"
}

interface Classification {
  frame: number
  status: string
}

interface AnalysisResult {
  right_hand_classification?: Classification[]
  left_hand_classification?: Classification[]
  body_posture_classification?: Classification[]
}

export function VideoAnalyzer({ type }: VideoAnalyzerProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0])
      setResults(null)
    }
  }

  const handleAnalyze = async () => {
    if (!videoFile) return

    setIsAnalyzing(true)

    // Simulate API call - replace with actual API endpoint
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock results based on type
    if (type === "hand") {
      setResults({
        right_hand_classification: [
          [5, "Correct"],
          [10, "Correct"],
          [15, "Slightly Curved"],
          [20, "Correct"],
        ] as any,
        left_hand_classification: [
          [5, "Flat Fingers"],
          [10, "Flat Fingers"],
          [15, "Correct"],
          [20, "Flat Fingers"],
        ] as any,
      })
    } else {
      setResults({
        body_posture_classification: [
          [5, "Correct"],
          [10, "Slouching"],
          [15, "Slouching"],
          [20, "Correct"],
          [25, "Too Far Forward"],
        ] as any,
      })
    }

    setIsAnalyzing(false)
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
          </div>

          {/* Results Section */}
          {results && (
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
                        {(results.right_hand_classification as any)?.map(
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

                  {/* Left Hand */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Left Hand</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(results.left_hand_classification as any)?.map(
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
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Body Posture Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(results.body_posture_classification as any)?.map(
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
