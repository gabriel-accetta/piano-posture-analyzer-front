import { HandRealtimeAnalysisResponse, HandRealtimeAnalysisResult, HandClassification, HandVideoAnalysisResponse, HandVideoAnalysisResult, HandFeatures } from "@/types/hand";

export function parseHandRealtimeAnalysisResponse(response: HandRealtimeAnalysisResponse[]): HandRealtimeAnalysisResult[] {
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

export function parseVideoAnalysisResponse(response: HandVideoAnalysisResponse): HandVideoAnalysisResult {
    const toHandFeatures = (arr: number[] = []): HandFeatures => ({
        wristAngle: arr[0] ?? 0,
        fingerCurvature: arr.slice(1, 4).map(x => x ?? 0),
        fingerJointAngles: arr.slice(4, 7).map(x => x ?? 0),
    });

    const leftHand = (response.left_hand_classification || []).map(item => ({
        timestamp: Math.round(item.timestamp ?? 0),
        features: toHandFeatures(item.features || []),
        classification: item.label as HandClassification,
    }));

    const rightHand = (response.right_hand_classification || []).map(item => ({
        timestamp: Math.round(item.timestamp ?? 0),
        features: toHandFeatures(item.features || []),
        classification: item.label as HandClassification,
    }));

    return {
        leftHand,
        rightHand,
    };
}