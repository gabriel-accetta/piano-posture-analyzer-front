"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoAnalyzer } from "@/components/video-analyzer"
import { RealtimeAnalyzer } from "@/components/realtime-analyzer"
import { Video, MonitorPlay, Hand, PersonStanding } from "lucide-react"

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<"body" | "hand">("body")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Piano Posture Analyzer</h1>
                <p className="text-sm text-muted-foreground">Real-time posture feedback for pianists</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Section Selection */}
        <div className="mb-8">
          <div className="flex gap-4">
            <Card
              className={`flex-1 cursor-pointer border-2 p-6 transition-all hover:border-primary/50 ${
                activeSection === "body" ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => setActiveSection("body")}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-lg p-3 ${activeSection === "body" ? "bg-primary/10" : "bg-muted"}`}>
                  <PersonStanding className={`h-6 w-6 ${activeSection === "body" ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-foreground">Body Posture Analyzer</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Analyze your sitting position, back alignment, and overall body posture while playing piano
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className={`flex-1 cursor-pointer border-2 p-6 transition-all hover:border-primary/50 ${
                activeSection === "hand" ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => setActiveSection("hand")}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-lg p-3 ${activeSection === "hand" ? "bg-primary/10" : "bg-muted"}`}>
                  <Hand
                    className={`h-6 w-6 ${activeSection === "hand" ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-foreground">Hand Posture Analyzer</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Monitor finger positioning, wrist angles, and hand shape for optimal piano technique
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Analysis Tabs */}
        <Tabs defaultValue="video" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video Analysis
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <MonitorPlay className="h-4 w-4" />
              Realtime Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="mt-6">
            <VideoAnalyzer type={activeSection} />
          </TabsContent>

          <TabsContent value="realtime" className="mt-6">
            <RealtimeAnalyzer type={activeSection} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
