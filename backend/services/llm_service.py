import httpx
import json
from database import settings

async def analyze_resume_with_groq(resume_text: str, job_description: str) -> dict:
    prompt = f"""
You are a brutally strict, domain-aware ATS (Applicant Tracking System) evaluator.
Your job is to compare a Resume against a Job Description and return a precise, math-backed analysis.

═══════════════════════════════════════════════
PHASE 1 — DOMAIN MATCH CHECK (Run this FIRST)
═══════════════════════════════════════════════
Before scoring anything, identify:
- The core profession/industry of the Job Description (e.g., Legal, Medical, Software Engineering, Finance)
- The core profession/industry of the Resume

If these do NOT match (e.g., Software Developer applying for Lawyer, Doctor applying for Data Analyst):
  → match_score MUST be between 5 and 19. No exceptions.
  → matched_skills MUST only include truly transferable skills (e.g., "research", "documentation") — maximum 3.
  → Do NOT match soft skills like "communication" or "teamwork" as domain skills.
  → Proceed to fill all other fields normally.

═══════════════════════════════════════════════
PHASE 2 — SKILL EXTRACTION (Domain match only)
═══════════════════════════════════════════════
Extract ONLY domain-specific, technical, or role-critical skills from the Job Description.
DO NOT include generic soft skills (communication, teamwork, leadership, etc.) unless the JD explicitly lists them as hard requirements with measurable criteria.

For each skill found in the JD:
- If it exists verbatim or as a clear equivalent in the resume → add to matched_skills
- If it is missing or only vaguely implied → add to missing_skills

Categorize every missing skill:
- "critical": Core requirement; its absence alone drops the score significantly (deduct 10-15 pts each)
- "medium": Important but not a dealbreaker (deduct 5-8 pts each)
- "low": Nice-to-have (deduct 2-4 pts each)

═══════════════════════════════════════════════
PHASE 3 — SCORE CALCULATION (Show your math)
═══════════════════════════════════════════════
1. Start at 100
2. For each CRITICAL missing skill: subtract 10 to 15 points
3. For each MEDIUM missing skill: subtract 5 to 8 points
4. For each LOW missing skill: subtract 2 to 4 points
5. If domain mismatch detected in Phase 1: cap score between 5–19 regardless of math

The match_score MUST reflect this math. If you have 4 critical missing skills, 
the score CANNOT be above 60. Be exact.

═══════════════════════════════════════════════
PHASE 4 — ACTIONABLE FEEDBACK
═══════════════════════════════════════════════
For rewritten_bullets:
- Pick 3 to 5 weak or generic bullets from the resume
- Rewrite them in strong XYZ format: "Accomplished [X] by doing [Y], resulting in [Z]"
- NATURALLY weave in the missing_skills keywords where relevant and honest
- These rewrites must be realistic — do not invent metrics or experiences not implied by the original bullet
- The goal is: if the user copies these rewritten bullets into their resume and re-runs the analysis, their score MUST increase

For ats_feedback:
- Give 4 to 6 specific, actionable points
- Each point must reference something concrete from the resume or JD (not generic advice)
- Include formatting, keyword density, and section-structure observations

═══════════════════════════════════════════════
OUTPUT FORMAT — Respond ONLY with this JSON. No markdown, no explanation, no extra text.
═══════════════════════════════════════════════
{{
  "domain_match": true,
  "match_score": 85,
  "score_breakdown": {{
    "base_score": 100,
    "critical_deductions": -20,
    "medium_deductions": -10,
    "low_deductions": -5,
    "domain_penalty": 0,
    "final_score": 65
  }},
  "matched_skills": [
    "Only domain-specific skills found in BOTH the JD and the resume"
  ],
  "missing_skills": [
    {{
      "skill": "Exact skill name from JD",
      "priority": "critical",
      "recommended_location": "Exact section in the resume where this should be added, e.g. 'Work Experience under TechCorp role' or 'Skills section'",
      "suggested_keyword": "The exact keyword or phrase to add to the resume for ATS to detect it"
    }}
  ],
  "ats_feedback": [
    "Specific feedback point referencing actual resume/JD content"
  ],
  "rewritten_bullets": [
    {{
      "original": "Original bullet copied exactly from resume",
      "rewritten": "XYZ-format rewrite with missing skill keywords naturally woven in",
      "skills_added": ["skill1", "skill2"]
    }}
  ]
}}

Job Description:
{job_description}

Resume:
{resume_text}
"""

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    try:
        content = data["choices"][0]["message"]["content"]
        result = json.loads(content)
    except (json.JSONDecodeError, KeyError) as e:
        raise ValueError(f"LLM returned invalid JSON or unexpected structure: {e}")

    # ── Score math override ─────────────────────────────────────────────────
    ai_score = result.get("match_score", 0)
    domain_match = result.get("domain_match", True)

    # Hard cap for domain mismatch — override anything the LLM hallucinated
    if not domain_match:
        result["match_score"] = min(ai_score, 19)
        return result

    # Weighted scoring for domain matches
    matched_skills = result.get("matched_skills", [])
    missing_skills = result.get("missing_skills", [])

    critical_count = sum(1 for s in missing_skills if s.get("priority") == "critical")
    medium_count   = sum(1 for s in missing_skills if s.get("priority") == "medium")
    low_count      = sum(1 for s in missing_skills if s.get("priority") == "low")

    # Use midpoint deductions
    calculated_score = 100
    calculated_score -= critical_count * 12
    calculated_score -= medium_count   * 6
    calculated_score -= low_count      * 3
    calculated_score = max(20, calculated_score)  # floor of 20 for domain matches

    # Never inflate above what LLM calculated — take the lower of the two
    result["match_score"] = min(calculated_score, ai_score)

    return result