# Add a completion sound on task done

## Goal
Play a soft chime sound every time a user completes a task, in both authenticated (`/app`) and demo (`/demo`) mode.

## Sound generation options

Lovable does not have a built-in sound effect generator. To generate audio, we have two paths:

1. **ElevenLabs connector (recommended)**
   - Connect ElevenLabs via Lovable connectors.
   - The app calls ElevenLabs' sound generation API with a prompt like "soft success chime".
   - Returns a short MP3 that plays on completion.

2. **Upload your own audio file**
   - You provide a short MP3/WAV file.
   - I place it in `public/sounds/complete.mp3` and play it directly.

## Recommended plan

Given you want a generated sound, I recommend **ElevenLabs**:

1. **Connect ElevenLabs**
   - Link an ElevenLabs account via Lovable connectors.
   - The app will use `ELEVENLABS_API_KEY` server-side.

2. **Create sound generation endpoint**
   - Add a TanStack Start server route (`/api/complete-sound`) that calls ElevenLabs' sound generation API.
   - Cache the generated audio locally (e.g. in `public/sounds/generated-complete.mp3`) to avoid regenerating on every completion.

3. **Play utility**
   - Create a small client-safe helper (`src/lib/sounds.ts`) that plays the cached/generated audio.
   - Handles autoplay restrictions and reduced-motion preferences.

4. **Wire into completion**
   - Trigger the sound when a task is marked complete in both `AppShell` (Today tab) and `TaskTable` (Tasks tab).
   - Works in both `/app` and `/demo` modes.

5. **Verification**
   - Build passes.
   - Browser check: complete a task and confirm the chime plays.

## Fallback: upload your own file

If you'd rather not connect ElevenLabs, upload a short MP3/WAV file (ideally 1–2 seconds) and I'll wire it up the same way using a static file in `public/sounds/`.

## What I need from you
Either:
- Connect an ElevenLabs account so I can generate the sound, or
- Upload the audio file you'd like to use.

Which would you prefer?
