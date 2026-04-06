import httpx
import json
from database import settings

async def analyze_resume_with_groq(resume_text: str, job_description: str) -> dict:
    prompt = f"""
    You are a ruthless, highly literal ATS (Applicant Tracking System) bot. 
    Analyze the following Resume against the Job Description.
    
    CRITICAL SCORING RUBRIC FOR 'match_score':
    1. ZERO TOLERANCE: If the job industry or core profession doesn't match (e.g., a Software Developer applying for a Doctor, Nurse, or unrelated Data Analyst role), the score MUST be below 20.
    2. STRICT MATH: Start at 100. Deduct 5 to 10 points for EVERY single core skill, qualification, or year of experience requirement missing from the resume.
    3. BE EXACT: If you identify 5 missing skills, the score cannot possibly be 90. It must mathematically reflect the missing requirements (e.g., 60 or 70). Do not give generic high scores.
    
    Respond ONLY with a valid JSON object matching this exact structure. DO NOT use percentage symbols in the match_score:
    {{
      "match_score": 85,
      "matched_skills": ["List of core job description keywords successfully found in the resume"],
      "missing_skills": [
        {{
          "skill": "Name of missing skill",
          "recommended_location": "Be specific about exactly where in the provided resume they should add this"
        }}
      ],
      "ats_feedback": ["feedback point 1", "feedback point 2"],
      "rewritten_bullets": [
        {{
          "original": "Original weak bullet from resume",
          "rewritten": "Strong, XYZ-format rewritten bullet"
        }}
      ]
    }}
    
    CRITICAL INSTRUCTION FOR REWRITTEN BULLETS:
    When writing the 'rewritten' bullets, you MUST try to naturally incorporate the 'missing_skills' you found into the new sentences.

    Job Description:
    {job_description}

    Resume:
    {resume_text}
    """

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1, 
        "response_format": {"type": "json_object"}
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions", 
            headers=headers, 
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        
        try:
            content = data['choices'][0]['message']['content']
            result = json.loads(content)
            
            # --- THE BULLETPROOF MATH OVERRIDE ---
            # Let the AI find the words, but force Python to do the actual math
            matched_count = len(result.get('matched_skills', []))
            missing_count = len(result.get('missing_skills', []))
            total_skills = matched_count + missing_count
            
            ai_score = result.get('match_score', 0)
            
            # If the AI tanked the score below 30 (like the Doctor applying for a Dev job), keep it.
            # Otherwise, override it with pure, hard keyword math!
            if ai_score >= 30 and total_skills > 0:
                real_score = int((matched_count / total_skills) * 100)
                result['match_score'] = real_score
                
            return result
            
        except (json.JSONDecodeError, KeyError) as e:
            raise ValueError(f"LLM did not return valid JSON or unexpected response format: {str(e)}")