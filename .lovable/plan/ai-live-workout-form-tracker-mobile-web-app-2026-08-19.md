# AI Live Workout Form Tracker (Mobile Web App)

A camera-based form coach that runs entirely in the browser on the phone. No video ever leaves the device, no account, no stored data — each session ends with a summary.

## Scope agreed
- Mobile web app (installable to home screen), not React Native
- Exercises: Squat and Push-up
- No login. Sessions are saved locally on the device (browser storage) so the user gets a personal history — nothing is uploaded.

## User flow
```text
[ Exercise Select ] -> [ Camera Setup & Calibration ] -> [ Live Tracking ] -> [ Summary ] -> [ History ]
     Squat/Push-up        full body in frame check         reps + cues        reps, flags, score   past sessions
```

## Screens
1. **Home / Exercise select** (`/`) — pick Squat or Push-up, short "how to set up your phone" guidance, Start button, plus a compact "recent sessions" strip and a link to full history.
2. **Session** (`/session/$exercise`) — three phases in one route:
   - *Calibration*: live camera with a body-outline guide; waits until all required joints are detected above confidence 0.5 for ~1.5s, then counts down 3-2-1.
   - *Tracking*: camera feed + skeleton overlay, rep counter, form-quality badge, correction banner, spoken cues, pause/end controls.
   - *Summary*: total reps, clean vs flagged reps, form score %, breakdown of most common errors, duration. Auto-saved to local history, with buttons to redo, view history, or pick another exercise.
3. **History** (`/history`) — list of past sessions newest first (date, exercise, reps, form score), simple stats header (total sessions, total reps, best form score, 7-day trend), tap a session to expand its error breakdown, delete one session, and clear all history.

## Local session history
- Stored in `localStorage` under a versioned key, as a JSON array of session records: id, ISO timestamp, exercise, duration, total/clean/flagged reps, form score, error counts by type.
- Capped at the 100 most recent sessions; oldest trimmed automatically.
- Read/write behind a small storage module with safe parsing and a hydration-safe hook, so SSR renders an empty state and history appears after mount.
- Clear-all and per-item delete with a confirm step. Data stays on the device; clearing browser data removes it — stated plainly in the UI.

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
- New files: rewritten `src/routes/index.tsx`, `src/routes/session.$exercise.tsx`, `src/routes/history.tsx`, `src/lib/pose/{detector,geometry,squat,pushup,types}.ts`, `src/lib/history.ts`, `src/hooks/useSessionHistory.ts`, `src/components/{CameraStage,SkeletonOverlay,TrackingHUD,CalibrationGuide,SummaryPanel,SessionCard}.tsx`, `src/hooks/useSpeechCues.ts`.
- Camera and TF modules load client-side only (dynamic import behind a hydration gate) so SSR never touches browser APIs.
- Manifest-only PWA metadata (`public/manifest.webmanifest`, icons, theme-color) for home-screen install; no service worker or offline caching.
- Route-level `head()` metadata on all three routes.

## Known limitations
- Requires HTTPS and camera permission; on iOS the camera works in Safari or the installed app.
- Accuracy depends on lighting, full-body framing, and a side/45-degree camera angle.
- Deadlift is intentionally out of this MVP.