# Form Coach AI

Product Requirement Document (PRD)
Project Title: AI-Powered Live Workout Form Tracker

Target Platform: iOS & Android (React Native)

Version: 1.0

Document Status: Draft / Engineering Review

1. Product Overview & Vision
The AI Workout Form Tracker is a React Native mobile application that turns a user’s smartphone camera into an automated, real-time personal trainer. By utilizing on-device pose estimation AI, the app analyzes body biomechanics in real time, provides instant visual and audio corrections, and logs repetition counts with accurate depth and technique validation.

2. Goals & Key Performance Indicators (KPIs)
Business & User Goals
Provide real-time exercise feedback without sending video streams to a remote server (100% private & offline-capable).

Prevent workout injuries by alerting users to critical errors (e.g., knee caving, rounded back).

Offer an effortless automated rep counter.

Technical & UX KPIs
Frame Rate: > 20 fps pose inference and skeleton overlay rendering on mid-tier mobile devices.

Latencies: < 100 ms feedback lag from motion to visual/audio alert.

On-Device Footprint: App bundle size addition for AI models under 25 mb.

Detection Accuracy: > 90% accuracy in rep counting and form error detection during proper lighting and camera setup.

3. Core Features & Technical Requirements
3.1 Live AI Camera & Pose Estimation
Camera Feed: Real-time back/front camera access utilizing react-native-vision-camera.

On-Device Pose Detection:

Runs MoveNet Lightning or MediaPipe Pose via react-native-fast-tflite.

Detects 17 to 33 key body landmarks (X, Y, Z coordinates and confidence score).

Frames downsampled to 256 x 256 before inference to conserve battery and avoid thermal throttling.

Dynamic Skeleton Overlay:

Rendered using @shopify/react-native-skia over the camera feed.

Joint lines dynamically change color: Green (Good Form), Yellow (Minor Warning), Red (Form Error).

3.2 Exercise Form Engine (Biomechanics)
State Machine Rep Counting: Tracks exercise states (e.g., Top / Descending / Bottom / Ascending / Rep Complete).

Supported MVP Exercises & Biomechanical Rules:

ExerciseKey Joint Angles / LandmarksForm Error Trigger ConditionsSquatHip-Knee-Ankle ($\theta_\text{knee}$), Knee-Ankle X-alignment• Depth insufficient ($\theta_\text{knee} > 90^\circ$ at bottom)


• Knee Valgus (Knees caving inward)

Push-UpShoulder-Elbow-Wrist ($\theta_\text{elbow}$), Shoulder-Hip-Ankle ($\theta_\text{spine}$)• Flared elbows ($> 75^\circ$ relative to torso)


• Hip sagging/arching ($\theta_\text{spine} < 160^\circ$)

DeadliftShoulder-Hip-Knee ($\theta_\text{back}$), Hip-Knee-Ankle• Rounded lower back ($\theta_\text{back}$ deviates from neutral line)
3.3 Audio & Visual Coaching Interface
Real-time Audio Cues: Text-to-speech cues (using expo-speech or react-native-tts) triggered on state changes or errors (e.g., "Go lower", "Keep knees out").

On-Screen HUD:

Live Rep Counter.

Current Form Score / Quality Badge.

Text banner for actionable corrections.

3.4 Calibration & Setup Guidance
Frame Positioning Checklist: On-screen box overlay asking the user to step back until their full body (head to toe) is detected.

Confidence Thresholding: Ignores joint keypoints with confidence score $< 0.5$ to prevent false detections from background objects.

4. User Flow & Journey
[ Exercise Selection ] ──► [ Camera Alignment & Positioning ] ──► [ Real-Time Tracking Loop ] ──► [ Workout Summary ]
      (Select Squat)           (Detect Head-to-Toe Joints)           (Count Reps & Give Cues)      (Reps, Errors, Form Score)
Selection: User picks an exercise (e.g., Squat) and sets phone against a bottle or wall.

Calibration: User steps into view. System verifies all key joints are visible ($\text{confidence} \ge 0.5$).

Execution: User performs reps. Visual skeleton overlays on screen and voice prompts give instant corrections.

Summary Screen: App shows total reps, valid reps vs. flagged reps, and an overall form score percentage.

5. Non-Functional Requirements
Privacy & Data Protection: All video processing must happen 100% on-device. No raw camera frames or videos are uploaded or stored externally.

Battery Efficiency: Frame processors must pause immediately when the user navigates away or pauses the session.

Platform Compatibility: iOS 14+ and Android 8.0+ (API level 26+ with NNAPI support).

6. Out of Scope (Future Phases)
3D spatial mesh / LiDAR support.

Wearable sync (Apple Watch / Wear OS heart rate integration).

Multi-person tracking in a single camera frame.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7ccce985-a4da-49ac-82af-78fa74f94f96).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
