export type Handedness = "Left" | "Right";

export interface HandFeatures {
  wristAngle: number;
  fingerCurvature: number[];
  fingerJointAngles: number[];
}

export type HandClassification = "Correct" | "Flat Fingers" | "High Wrist" | "Dropped Wrist" | "Collapsed Fingers";

export interface HandRealtimeAnalysisResult {
  handedness: Handedness;
  features: HandFeatures;
  classification: HandClassification;
}

export interface HandRealtimeAnalysisResponse {
  hand: string;
  features: number[];
  label: string;
}
export interface HandVideoAnalysisResult {
  leftHand: {
    timestamp: number;
    features: HandFeatures;
    classification: HandClassification;
  }[];
  rightHand: {
    timestamp: number;
    features: HandFeatures;
    classification: HandClassification;
  }[];
}

export interface HandVideoAnalysisResponse {
  left_hand_classification: {
    timestamp: number;
    features: number[];
    label: string;
  }[];
  right_hand_classification: {
    timestamp: number;
    features: number[];
    label: string;
  }[];
}