# AI Live Workout Form Tracker (Mobile Web App)

A camera-based form coach that runs entirely in the browser on the phone. No video ever leaves the device, no account, no stored data — each session ends with a summary.

## Scope agreed
- Mobile web app (installable to home screen), not React Native
- Exercises: Squat and Push-up
- No login, no saved history — summary shown at end of session only

## User flow
```text
[ Exercise Select ] -> [ Camera Setup & Calibration ] -> [ Live Tracking ] -> [ Summary ]
     Squat/Push-up        full body in frame check         reps + cues        reps, flags, score
```

## Screens
1. **Home / Exercise select** (`/`) — pick Squat or Push-up, short "how to set up your phone" guidance, Start button.
2. **Session** (`/session/$exercise`) — three phases in one route:
   - *Calibration*: live camera with a body-outline guide; waits until all required joints are detected above confidence 0.5 for ~1.5s, then counts down 3-2-1.
   - *Tracking*: camera feed + skeleton overlay, rep counter, form-quality badge, correction banner, spoken cues, pause/end controls.
   - *Summary*: total reps, clean vs flagged reps, form score %, breakdown of most common errors, buttons to redo or pick another exercise.

## How the AI works
- Camera via `getUserMedia` (front/back toggle), rendered into a `<video>` element.
- Pose detection with TensorFlow.js MoveNet SinglePose Lightning on the WebGL backend, model fetched from CDN so the bundle stays small. Frames downscaled to 256x256 for inference; loop throttled to ~24 fps and skips while a frame is still processing.
- Skeleton drawn on a `<canvas>` layered over the video; joint/limb color = green (good), amber (warning), red (error). Keypoints below 0.5 confidence are ignored.
- Everything runs client-side; frames are never uploaded or recorded.

## Form engine
Shared 2D angle helpers plus one rule module per exercise, each a small state machine.

**Squat** — Top -> Descending -> Bottom -> Ascending -> rep complete.
- Rep counted on a full knee-angle cycle.
- Errors: insufficient depth (knee angle > 90 deg at bottom), knee valgus (knees collapsing inside ankles beyond tolerance).
- Cues: "Go lower", "Knees out".

**Push-up** — Top -> Descending -> Bottom -> Ascending -> rep complete.
- Rep counted on a full elbow-angle cycle.
- Errors: flared elbows (> 75 deg relative to torso), hips sagging or piking (shoulder-hip-ankle angle < 160 deg).
- Cues: "Tuck your elbows", "Straighten your hips".

Each rep is tagged clean or flagged; form score = clean reps / total reps, adjusted by time spent in an error state.

## Audio coaching
Browser `speechSynthesis` for cues with a per-cue cooldown (~2.5s) so it doesn't spam. Mute toggle in the HUD; audio unlocks on the Start tap.

## Performance & battery
- Detection loop uses `requestAnimationFrame` with frame skipping, and stops on pause, tab hide, route change, and unmount; camera tracks stopped too.
- Subtle FPS/status indicator during tracking.

## Design direction
Dark athletic UI — near-black background, high-contrast lime/amber/red state colors that double as the skeleton palette, condensed display type for numbers, oversized rep counter. All colors as semantic tokens in `src/styles.css`.

## Technical notes
- Packages: `@tensorflow/tfjs-core`, `@tensorflow/tfjs-backend-webgl`, `@tensorflow-models/pose-detection`.
- New files: rewritten `src/routes/index.tsx`, `src/routes/session.$exercise.tsx`, `src/lib/pose/{detector,geometry,squat,pushup,types}.ts`, `src/components/{CameraStage,SkeletonOverlay,TrackingHUD,CalibrationGuide,SummaryPanel}.tsx`, `src/hooks/useSpeechCues.ts`.
- Camera and TF modules load client-side only (dynamic import behind a hydration gate) so SSR never touches browser APIs.
- Manifest-only PWA metadata (`public/manifest.webmanifest`, icons, theme-color) for home-screen install; no service worker or offline caching.
- Route-level `head()` metadata on both routes.

## Known limitations
- Requires HTTPS and camera permission; on iOS the camera works in Safari or the installed app.
- Accuracy depends on lighting, full-body framing, and a side/45-degree camera angle.
- Deadlift is intentionally out of this MVP.