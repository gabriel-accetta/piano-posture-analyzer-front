export interface BodyFeatures {
    torsoInclination: number;
    neckAngle: number;
    shoulderTension: number;
    elbowAngle: number;
    forearmSlope: number;
}

export type BodyClassification = "Correct" | "Slouched" | "Head Forward" | "Shoulders Raised" | "Elbow Dropped" | "Elbow Raised";

// Realtime Analysis
export interface BodyRealtimeAnalysisResult {
    features: BodyFeatures;
    classification: BodyClassification;
}

export interface BodyRealtimeAnalysisResponse {
    features: number[];
    label: string;
}

// Video Analysis
export interface BodyVideoAnalysisResult {
    timestamp: number;
    features: BodyFeatures;
    classification: BodyClassification;
}

export interface BodyVideoAnalysisResponse {
    body_classification: {
        timestamp: number;
        features: number[];
        label: string;
    }[];
}