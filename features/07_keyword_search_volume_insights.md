# Feature Spec F-07: Keyword Search Volume & Competition Insights

## 1. Overview & Business Value
Creators need to know not just *what* tags to use, but *how competitive* and *high-volume* their keywords are.
- **Value Proposition:** Calculates quantitative Search Volume Potential, Keyword Competition Index, and reveals 3 untapped Long-Tail Keyword Opportunities extracted directly from the video script.

---

## 2. Zero-Dependency Contract
Completely standalone. Enriches the `seo_breakdown` diagnostic card without modifying core generation workflows.

---

## 3. Data Model & Schema

### Backend Pydantic Model (`backend/main.py`)
```python
class KeywordInsight(BaseModel):
    keyword: str
    search_volume_tier: str = Field(..., description="'High', 'Medium', 'Niche / Long-tail'")
    competition_index: float = Field(..., ge=0.0, le=100.0, description="0 = low competition, 100 = saturated")
    opportunity_score: float = Field(..., ge=0.0, le=100.0, description="High search + low competition = high score")

class KeywordDiagnosticsResponse(BaseModel):
    primary_keywords: list[KeywordInsight]
    untapped_opportunities: list[str]
```

### Frontend TypeScript Interface (`frontend/lib/types.ts`)
```typescript
export interface KeywordInsight {
  keyword: string;
  searchVolumeTier: "High" | "Medium" | "Niche / Long-tail";
  competitionIndex: number;
  opportunityScore: number;
}

export interface KeywordDiagnosticsData {
  primaryKeywords: KeywordInsight[];
  untappedOpportunities: string[];
}
```

---

## 4. Backend Implementation Plan
- **Route:** `POST /api/diagnostics/keywords`
- **Methodology:**
  1. Leverage `backend/keyword_extractor.py` to extract n-grams, bigrams, and trigrams.
  2. Query YouTube autocomplete / search suggestions API (zero API cost) to evaluate search breadth.
  3. Compute `opportunity_score = (search_volume_weight * 0.6) + ((100 - competition_index) * 0.4)`.

---

## 5. Frontend UI/UX Specification
- **Component Location:** Integrated into the `SEO Diagnostics` card in `OutputGrid`.
- **Visuals:**
  - Color-coded difficulty badges (Green: High Opportunity, Yellow: Moderate, Red: Saturated).
  - One-click `"Add to Tags"` chip for suggested long-tail opportunities.

---

## 6. Verification & Test Plan
- **Unit Test:** Verify `competition_index` and `opportunity_score` are within 0–100 bounds and correctly categorize n-grams.
- **Frontend Test:** Verify clicking an untapped keyword immediately appends it to the active tags list.
