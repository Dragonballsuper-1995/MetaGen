# Feature Spec F-05: Creator Persona & Tone Customizer

## 1. Overview & Business Value
Different YouTube niches require distinctly different tonalities:
- A technical software tutorial needs precise, specification-grounded authority.
- A documentary / essay video requires narrative drama and cliffhanger hooks.
- A gaming / entertainment channel requires high-energy, slang-aware enthusiasm.
- An educational video requires structured clarity and beginner-friendly analogies.

---

## 2. Zero-Dependency Contract
Standalone prompt modifier. Passes a `tone` parameter to existing generation endpoints without changing output schemas.

---

## 3. Tone Profiles Matrix

| Tone ID | Name | Voice & Style Directives | Target Format / Niche |
| :--- | :--- | :--- | :--- |
| `tech_authority` | **Tech & Engineering** | Authoritative, spec-accurate, architecture-grounded, zero fluff. | Coding, Hardware, System Design, DevOps |
| `viral_curiosity` | **Viral Entertainment** | High curiosity gap, emotional urgency, suspenseful framing. | Pop culture, Challenge videos, Mystery |
| `masterclass` | **Educational & Masterclass** | Structured, beginner-friendly, high keyword density, clear outcomes. | Online courses, Tutorials, Explainer videos |
| `storytelling` | **Documentary & Narrative** | Story-driven, dramatic arc, character & conflict framing. | Video essays, Case studies, Retrospectives |
| `casual_vlog` | **Casual & Community** | Warm, conversational, relatable, community-centric CTAs. | Vlogs, Lifestyle, Travel, Behind-the-scenes |

---

## 4. Backend Implementation Plan

### Schema Extension (`backend/main.py`)
```python
class VideoRequest(BaseModel):
    text: str = Field(..., min_length=20, max_length=3000)
    model: str = Field(default="auto")
    tone: str = Field(default="tech_authority", description="Tone profile ID")
```

### Prompt Factory Integration (`backend/utils/prompt_factory.py`)
```python
TONE_INSTRUCTIONS = {
    "tech_authority": "Tone: Authoritative, engineering-grade, and grounded in technical entities without hype.",
    "viral_curiosity": "Tone: High-stakes curiosity, punchy, conversational, and designed for maximum click-through interest.",
    "masterclass": "Tone: Educational, pedagogical, structured, highlighting key learning milestones.",
    "storytelling": "Tone: Cinematic, narrative-driven, focusing on tension, turning points, and resolution.",
    "casual_vlog": "Tone: Warm, conversational, friendly, and community-focused.",
}

def get_system_prompt_for_tone(base_prompt: str, tone: str) -> str:
    instruction = TONE_INSTRUCTIONS.get(tone, TONE_INSTRUCTIONS["tech_authority"])
    return f"{base_prompt}\n\nSTYLE INSTRUCTION:\n{instruction}"
```

---

## 5. Frontend UI/UX Specification
- **Component Location:** A compact pill / dropdown selector next to the Model Selector in `TerminalCore`:
  - `[ 🎯 Tone: Tech Authority ▾ ]`
- Offers instant selection chips for quick switching.

---

## 6. Verification & Test Plan
- **Unit Test:** Submit the same script with `tone="tech_authority"` vs `tone="viral_curiosity"` and verify distinct stylistic vocabulary and hook angles in generated titles and descriptions.
