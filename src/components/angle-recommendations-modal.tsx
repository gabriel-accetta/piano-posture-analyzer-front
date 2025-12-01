"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Separator } from "@/components/ui/separator";

interface AngleRecommendationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "body" | "hand";
}

export function AngleRecommendationsModal({
  open,
  onOpenChange,
  type,
}: AngleRecommendationsModalProps) {
  const content = {
    body: {
      imageSrc: "/body-angle.png",
      description:
        "Position the camera at a 90-degree angle to the side of the pianist. Ensure the frame captures the full upper body, with the back straight (90-100°), elbows level with the keys, and feet flat on the floor for optimal posture analysis.",
      imageAlt: "Body posture camera angle guide",
    },
    hand: {
      imageSrc: "/hand-angle.png",
      description:
        "Position the camera to get a clear view of the hands and keyboard. Ensure wrists are visible and level (150-180°), and fingers are curved (45-60°). The camera should be stable and focused on the hand movements.",
      imageAlt: "Hand posture camera angle guide",
    },
  };

  const currentContent = content[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Camera Angle Recommendations
          </DialogTitle>
          <DialogDescription>
            Follow these guidelines for the best results
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Placeholder */}
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
            <img src={currentContent.imageSrc} alt={currentContent.imageAlt} className="h-full object-contain" />
          </div>

          <div className="rounded-lg bg-primary/5 p-6 border border-primary/10">
            <p className="text-lg leading-relaxed text-foreground">
              {currentContent.description}
            </p>
          </div>
        </div>

        <Separator />

        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> These
            recommendations are guidelines. Individual body proportions vary, so
            adjust as needed for comfort while maintaining proper technique.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
