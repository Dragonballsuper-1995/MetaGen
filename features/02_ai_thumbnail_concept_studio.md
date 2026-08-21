# Feature Spec F-02: AI Thumbnail Concept & Visual Hook Studio

## 1. Overview & Business Value
A video's click-through rate (CTR) is 80% determined by the visual pairing of the **Thumbnail + Title**. Even the best SEO metadata fails if the thumbnail does not grab attention.
- **Value Proposition:** Generates 3 distinct high-converting visual concepts, 2–4 word high-contrast text overlays, and ready-to-use AI generation prompts (for Midjourney v6, Flux.1, or DALL-E 3) tailored to the video script.

---

## 2. Zero-Dependency Contract
Completely standalone. Can be requested alongside metadata generation or called independently via a dedicated endpoint.

---

## 3. Data Model & Schema

### Backend Pydantic Model (`backend/main.py`)
```python
class ThumbnailConcept(BaseModel):
    id: str = Field(..., description="Unique concept identifier (e.g. concept_1)")
    angle: str = Field(..., description="Concept angle: 'Curiosity Split', 'Reaction / Emotion', 'Macro Detail'")
    visual_layout: str = Field(..., description="Detailed description of visual composition and subject placement")
    overlay_text: str = Field(..., max_length=25, description="Bold 2-4 word text overlay for the thumbnail graphic")
    color_palette: list[str] = Field(..., description="High-contrast color scheme (e.g. ['#FF0055', '#000000', '#FFFFFF'])")
    image_prompt: str = Field(..., description="Full text prompt for Midjourney/Flux.1/DALL-E")

class ThumbnailStudioResponse(BaseModel):
    concepts: list[ThumbnailConcept] = Field(..., min_length=2, max_length=4)
```

### Frontend TypeScript Interface (`frontend/lib/types.ts`)
```typescript
export interface ThumbnailConcept {
  id: string;
  angle: string;
  visualLayout: string;
  overlayText: string;
  colorPalette: string[];
  imagePrompt: string;
}

export interface ThumbnailStudioData {
  concepts: ThumbnailConcept[];
}
```

---

## 4. Prompt Engineering & LLM Directives

```python
SYSTEM_PROMPT_THUMBNAILS = """You are an elite YouTube thumbnail strategist and art director. Analyze the provided video script and create 3 high-CTR visual thumbnail concepts.

RULES FOR HIGH CTR THUMBNAILS:
1. Simplicity: 1 focal subject, high contrast, clean background.
2. Text Overlay: Maximum 2-4 punchy words that COMPLEMENT (not repeat) the title.
3. Visual Tension: Evoke curiosity, shock, transformation, or extreme comparison.
4. Output STRICT JSON in the following schema:
{
  "concepts": [
    {
      "id": "concept_1",
      "angle": "Split-Screen Extreme Transformation",
      "visual_layout": "Left half shows a chaotic, cluttered server room in dim red light. Right half shows a sleek, glowing single microchip in ultra-clean blue lighting.",
      "overlay_text": "ZERO LATENCY?",
      "color_palette": ["#FF2A54", "#00F0FF", "#0A0A0E"],
      "image_prompt": "Cinematic split screen comparison, left side messy red server room, right side futuristic blue glowing microchip, 8k resolution, octane render, dramatic lighting, shot on 35mm lens --ar 16:9"
    }
  ]
}
"""
```

---

## 5. Backend Implementation Plan
- **Route:** `POST /api/generate/thumbnails`
- **Controller:**
  1. Accepts `{ text: str, title?: str, model?: str }`.
  2. Executes prompt via `_llm_call()` with JSON validation.
  3. Returns parsed `ThumbnailStudioResponse`.

---

## 6. Frontend UI/UX Specification
- **Component Location:** Embedded in `OutputGrid` or accessible via a `"Thumbnail Studio"` tab.
- **Visuals:**
  - 16:9 aspect ratio thumbnail mockup cards showing visual layout descriptions and simulated large overlay typography.
  - One-click `"Copy Midjourney / Flux Prompt"` button.
  - One-click `"Copy Overlay Text"` button.

---

## 7. Verification & Test Plan
- **Unit Test:** Submit script to `/api/generate/thumbnails` and verify 3 valid concepts returned with valid 16:9 image prompts and concise overlay text under 25 chars.
- **Frontend Test:** Verify thumbnail card rendering in both dark and light modes with proper 16:9 aspect ratio constraints.
