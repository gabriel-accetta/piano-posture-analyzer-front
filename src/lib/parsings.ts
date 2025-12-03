import { HandRealtimeAnalysisResponse, HandRealtimeAnalysisResult, HandClassification } from "@/types/hand";

export function parseHandAnalysisResponse(response: HandRealtimeAnalysisResponse[]): HandRealtimeAnalysisResult[] {
    return response.map(res => {
        const handedness = res.hand === "Left" ? "Left" : "Right";

        const features = {
            wristAngle: res.features[0],
            fingerCurvature: res.features.slice(1, 4),
            fingerJointAngles: res.features.slice(4, 7),
        };

        const classification = res.label as HandClassification;
        
        return {
            handedness,
            features,
            classification,
        };
    });
}