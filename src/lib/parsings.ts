import { BodyRealtimeAnalysisResponse, BodyRealtimeAnalysisResult, BodyClassification, BodyVideoAnalysisResponse, BodyVideoAnalysisResult, BodyFeatures } from "@/types/body";
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

export function parseHandVideoAnalysisResponse(response: HandVideoAnalysisResponse): HandVideoAnalysisResult {
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

export function parseBodyRealtimeAnalysisResponse(response: BodyRealtimeAnalysisResponse): BodyRealtimeAnalysisResult {
        const features = {
            torsoInclination: response.features[0],
            neckAngle: response.features[1],
            shoulderTension: response.features[2],
            elbowAngle: response.features[3],
            forearmSlope: response.features[4],
        };
        
        const classification = response.label as BodyClassification;
        
        return {
            features,
            classification,
        };
}

export function parseBodyVideoAnalysisResponse(response: BodyVideoAnalysisResponse): BodyVideoAnalysisResult[] {
    const toBodyFeatures = (arr: number[] = []): BodyFeatures => ({
        torsoInclination: arr[0] ?? 0,
        neckAngle: arr[1] ?? 0,
        shoulderTension: arr[2] ?? 0,
        elbowAngle: arr[3] ?? 0,
        forearmSlope: arr[4] ?? 0,
    });

    return (response.body_classification || []).map(item => ({
        timestamp: Math.round(item.timestamp ?? 0),
        features: toBodyFeatures(item.features || []),
        classification: item.label as BodyClassification,
    }));
}