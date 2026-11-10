# FitMatch AI — 1-Page Solution Brief

>**Universal 8-Dimension Body Profiling, Hands-Free Gnani Voice-Guided Measurement & 3D Fit Intelligence Engine**

## 1. Project Overview
**FitMatch AI** eliminates apparel sizing guesswork by pairing an **8-dimension biometric body profile** (Upper Body: *Chest, Shoulder, Neck, Arm Length*; Lower Body: *Waist, Hip, Thigh, Inseam*) with a **category-specific deterministic fit engine** and a **real-time Three.js 3D studio**. Customers calibrate hands-free using conversational voice guidance (**Gnani Prisma STT** + **Gnani Timbre TTS** via a zero-secret FastAPI proxy) or manual entry, inspect 3D garment drape and tension heatmaps, and view exact garment-ease scores ($\text{Ease} = \text{Garment Spec} - \text{Body Spec}$).

## 2. Problem Statement
* **Vanity Sizing & Returns:** Brand-to-brand label inconsistencies (*S/M/L* vs *42R*) drive high fit-related apparel returns.
* **Single-Dimension Blind Spots:** Recommending sizes from one primary metric (*e.g., waist alone for jeans*) ignores critical fit points (*hip, thigh, inseam*), producing misleading scores.
* **Browser Voice Frictions:** Raw cloud TTS PCM fails inside `<audio>`, browser WebM uploads fail strict cloud STT formats, concurrent TTS/STT triggers `429` limits, and speaker echo truncates speech mid-sentence.

## 3. Proposed Solution
* **Strict Category-Specific Validation (`fitEngine.js`, `types.js`):** Runs `validateRequiredMeasurements()` and `validateGarmentDimensions()` before scoring: **T-Shirts** (*Chest, Waist, Shoulder*), **Shirts** (*Chest, Waist, Shoulder, Neck, Arm*), **Jeans/Trousers** (*Waist, Hip, Inseam, Thigh*), **Jackets** (*Chest, Shoulder, Arm*), **Dresses** (*Bust/Chest, Waist, Hip*). Returns `insufficient_data` badges or `insufficient_product_data` instead of premature sizes.
* **Deterministic Ease & 3D Tension Studio:** Scores weighted ease, asymmetric tightness penalties ($1.8\times\text{--}2.5\times$), fabric stretch (`none: 0 cm`–`high: 5 cm`), and Three.js stress heatmaps over *Cashmere Blazer*, *Asymmetric Shirt*, *Pantalon*, and *Trench Coat* meshes, while separating `EMPTY_USER_PROFILE` from the 8-dimension `DEMO_USER_PROFILE` (`42R`).

## 4. Gnani AI Integration
* **Gnani Timbre TTS (`api.vachana.ai/api/v1/tts/inference`, `timbre-v2.5`, Male `Vikrant`):** FastAPI wraps headerless 48kHz PCM streams into playable `RIFF` `audio/wav` buffers (`_ensure_playable_audio`), warms the opening prompt at startup, caches prompts (`_TTS_CACHE`), and locks offline fallback strictly to consistent OS male voices (`selectConsistentMaleVoice`).
* **Gnani Prisma STT (`api.vachana.ai/stt/v3`, `prisma-v2.5`, `en-IN`):** Browser encodes clean 16kHz mono `.wav` (`encodeWAV`), pauses capture during active TTS + 450ms echo cooldown (`isInEchoCooldown`), and routes all calls through a shared `asyncio api_lock` + Primary/Secondary key failover (`gnani_fallback.py`). `measurement_extractor.py` parses En/Hi/Hinglish numbers with smart inch auto-conversion (`"waist 32" → 81.3 cm`).

## 5. Technology Stack

| Layer | Stack (`FitMatch-AI-main`) |
| :--- | :--- |
| **Frontend & 3D WebGL** | React `18.3.1`, Vite `5.2.11`, Three.js `0.164.1`, `@react-three/fiber` `8.16.6`, `@react-three/drei` `9.105.6`, Tailwind CSS `3.4.3`, Framer Motion `11.2.10` |
| **Backend Proxy & NLP** | Python FastAPI `>=0.110.0`, Uvicorn `>=0.28.0`, HTTPX `>=0.27.0`, Pydantic Settings `>=2.2.0` |
| **Voice AI Platform** | Gnani Vachana Cloud (**Prisma `prisma-v2.5` STT** & **Timbre `timbre-v2.5` Male `Vikrant` TTS**), Web Audio 16kHz PCM WAV |

## 6. Screenshots & Architecture

* **Implemented Architecture:** React frontend → FastAPI services → Gnani STT/TTS, with measurement validation and product-specific fit evaluation.

![FitMatch AI System Architecture](docs/screenshots/00-architecture-diagram.png)

* **Actual FitMatch AI Frontend:** Homepage 3D LiDAR experience, multi-modal Fit Finder, Voice Calibration HUD, category validation & fabric telemetry.

| Homepage & 3D Fit Scene | Voice Calibration (Gnani Primary) | 3D Customizer & Missing Dim Validation |
| :---: | :---: | :---: |
| ![Homepage Hero](docs/screenshots/06-frontend-homepage-hero.jpg) | ![Voice Calibration](docs/screenshots/08-frontend-voice-calibration.jpg) | ![3D Customizer Validation](docs/screenshots/09-frontend-3d-customizer-validation.jpg) |
| **Multi-Modal Fit Finder** | **Biomechanical Fabric Physics** | **Virtual Archive Collection** |
| ![Fit Finder Modal](docs/screenshots/07-frontend-fit-finder-modal.jpg) | ![Fabric Physics Telemetry](docs/screenshots/10-frontend-fabric-physics.jpg) | ![Virtual Archive](docs/screenshots/11-frontend-virtual-archive.jpg) |

* **Gnani API Evidence:** Live STT audio upload & structured measurement response alongside TTS `Vikrant` `audio/wav` response.

| Gnani STT (`POST /api/voice/stt`) | Gnani TTS (`POST /api/voice/tts`) |
| :---: | :---: |
| ![STT Request](docs/screenshots/04-stt-request-swagger.png) | ![TTS Request](docs/screenshots/01-tts-request-swagger.png) |
| ![STT 200 Extraction](docs/screenshots/05-stt-extraction-200.png) | ![TTS 200 WAV Audio](docs/screenshots/03-tts-audio-wav-200.png) |

## 7. Impact
* **Verified Fit Precision:** Eliminates incomplete single-metric sizing by validating every required body & chart dimension per clothing category before displaying a recommendation.
* **Hands-Free Voice Reliability:** Zero-echo 16kHz/48kHz WAV audio, consistent male neural voice guidance, and multilingual inch/cm parsing unlock seamless accessibility while holding a measuring tape.
* **Production Resilience:** Zero exposed client secrets, serialized `api_lock` concurrency handling, startup prompt caching, and automated multi-key failover prevent API stalls.
