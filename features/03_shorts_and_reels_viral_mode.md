# Feature Spec F-03: YouTube Shorts & Reels Viral Mode

## 1. Overview & Business Value
Short-form video (YouTube Shorts, Instagram Reels, TikTok) operates on fundamentally different algorithmic principles than long-form YouTube:
- **Hook Speed:** Viewers swipe away within 1.5 to 3 seconds if not immediately hooked.
- **Title Constraints:** Titles must be ultra-short (<50 chars) and optimized for mobile feed thumbnails.
- **Hashtag Clustering:** 3 to 6 targeted viral hashtags are essential for algorithmic categorization.
- **Pinned Comment CTA:** Drives the initial wave of engagement and comments.

---

## 2. Zero-Dependency Contract
Independent module. Operates as an alternative generation profile or a toggled format switch (`mode: "shorts"` vs `mode: "longform"`).

---

## 3. Data Model & Schema

### Backend Pydantic Model (`backend/main.py`)
```python
class ShortsMetadataResult(BaseModel):
    title: str = Field(..., min_length=15, max_length=55, description="High-curiosity title under 55 chars")
    first_3s_hooks: list[str] = Field(..., min_length=2, max_length=3, description="Punchy opening verbal/visual hooks")
    description: str = Field(..., max_length=300, description="Short mobile description with hashtags")
    hashtags: list[str] = Field(..., min_length=3, max_length=6, description="Trending hashtags prefixed with #")
    pinned_comment_hook: str = Field(..., description="High-converting discussion starter comment")
    seo_score: float | None = Field(default=None, ge=0, le=100)
```

### Frontend TypeScript Interface (`frontend/lib/types.ts`)
```typescript
export interface ShortsMetadataResult {
  title: string;
  first3sHooks: string[];
  description: string;
  hashtags: string[];
  pinnedCommentHook: string;
  seoScore?: number;
}
```

---

## 4. Prompt Engineering & LLM Directives

```python
SYSTEM_PROMPT_SHORTS = """You are a viral short-form video strategist specializing in YouTube Shorts, TikTok, and Instagram Reels.

Analyze the script and generate viral short-form metadata:
1. Title: Under 50 characters, high intrigue, capitalization on key words.
2. First 3s Hook: 2-3 opening sentence hooks designed to eliminate scroll-away rate.
3. Hashtags: 4-6 high-traffic, relevant tags starting with # (e.g. #Shorts, #Tech, #Coding).
4. Pinned Comment: A polarizing or interactive question to generate comments.

Output STRICT JSON:
{
  "title": "Stop Using useEffect Like This ❌",
  "first_3s_hooks": [
    "90% of React developers are using useEffect completely wrong.",
    "If your app is lagging, check this one line in your code."
  ],
  "description": "The biggest mistake React devs make with useEffect and how to fix it in 30 seconds. #Shorts #ReactJS #WebDev #Coding",
  "hashtags": ["#Shorts", "#ReactJS", "#WebDev", "#Coding", "#JavaScript"],
  "pinned_comment_hook": "How many times have you triggered an infinite re-render loop by accident? Be honest 👇"
}
"""
```

---

## 5. Backend Implementation Plan
- **Route:** `POST /api/generate/shorts` (or query parameter `?format=shorts` on `/api/generate/stream`).
- **Controller:** Runs `_llm_call()` or stream using `SYSTEM_PROMPT_SHORTS`. Enforces strict character bounds.

---

## 6. Frontend UI/UX Specification
- **Component Location:** Format toggle pill in `TerminalCore` (`[ 📹 Long-Form ] [ 📱 Shorts / Reels ]`).
- **Shorts View in Output:**
  - 9:16 vertical phone mockup preview showing the title, sound icon, and simulated Shorts interface.
  - "Copy All for Shorts" button.
  - 3-Second Hook highlight card.

---

## 7. Verification & Test Plan
- **Unit Test:** Verify `title` length is strictly $\le 55$ chars, hashtags start with `#`, and 3-second hooks are generated.
- **Frontend Test:** Toggle between Long-Form and Shorts and verify UI transitions cleanly to the 9:16 vertical simulator.
