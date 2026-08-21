# Feature Spec F-01: Auto Video Chapters & Timestamp Generator

## 1. Overview & Business Value
YouTube video chapters break up a video into sections, each with an individual preview. Chapters add info and context to each portion of the video and let viewers easily rewatch different parts.
- **SEO Impact:** Google indexes YouTube chapters directly into Google Search results as "Key Moments", driving massive organic search traffic.
- **Viewer Retention:** Increases average view duration by allowing viewers to quickly find specific answers in long-form tutorials and podcasts.

---

## 2. Zero-Dependency Contract
This feature is completely standalone. When enabled, it processes the input script and generates timestamped chapter markers without altering or requiring any other optional feature.

---

## 3. Data Model & Schema

### Backend Pydantic Model (`backend/main.py`)
```python
class ChapterItem(BaseModel):
    timestamp: str = Field(..., description="Timestamp in mm:ss or hh:mm:ss format, starting with 00:00")
    title: str = Field(..., min_length=3, max_length=50, description="Clear, descriptive chapter name")

class ChaptersResult(BaseModel):
    chapters: list[ChapterItem] = Field(..., min_length=3, max_length=15)
    formatted_text: str = Field(..., description="Ready-to-paste text block for YouTube description")
```

### Frontend TypeScript Interface (`frontend/lib/types.ts`)
```typescript
export interface ChapterItem {
  timestamp: string;
  title: string;
}

export interface ChaptersData {
  chapters: ChapterItem[];
  formattedText: string;
}
```

---

## 4. Prompt Engineering & LLM Directives

```python
SYSTEM_PROMPT_CHAPTERS = """You are an expert YouTube editor. Analyze the provided video script or outline and generate logical, chronological video chapters.

RULES:
1. The first chapter MUST start at 00:00 (usually "Introduction" or hook title).
2. Generate between 4 and 10 chapters based on natural topic transitions.
3. Chapter titles must be concise (2 to 6 words), clear, and curiosity-driven.
4. Output STRICT JSON only in the following schema:
{
  "chapters": [
    {"timestamp": "00:00", "title": "Introduction & Core Problem"},
    {"timestamp": "01:45", "title": "Understanding the Fundamentals"},
    {"timestamp": "04:10", "title": "Step-by-Step Implementation"},
    {"timestamp": "08:30", "title": "Common Mistakes to Avoid"},
    {"timestamp": "11:15", "title": "Summary & Next Steps"}
  ]
}
"""
```

---

## 5. Backend Implementation Plan
- **Route:** `POST /api/generate/chapters`
- **Controller:**
  1. Estimate approximate timing based on word count (~130-150 words per minute of speaking time) or detect natural section headers/cues in the script.
  2. Invoke `_llm_call()` or streamed completion using the selected model.
  3. Validate that the first timestamp is `"00:00"` and that timestamps are monotonically increasing.
  4. Format the output string:
     ```text
     00:00 - Introduction & Core Problem
     01:45 - Understanding the Fundamentals
     04:10 - Step-by-Step Implementation
     ...
     ```

---

## 6. Frontend UI/UX Specification
- **Component Location:** Rendered inside `OutputGrid` as an expandable Bento card `"Video Chapters & Timestamps"`.
- **Interactions:**
  - One-click `"Copy Timestamps for Description"` button.
  - Interactive clickable timeline scrubber previewing chapter milestones.
  - Inline editing capability for timestamps before copying.

---

## 7. Verification & Test Plan
- **Unit Test:** Submit a 1,000-word script to `/api/generate/chapters` and verify:
  - Valid JSON returned.
  - Exactly starts at `00:00`.
  - Monotonically increasing time markers.
  - Clean formatted string.
- **Frontend Test:** Verify copying chapters prepends or appends to the description without formatting errors.
