import json
from typing import Dict, Any, List
from app.services.ai_prompt_engine import _chat, _parse_json_response

def evaluate_student_submission(phase: str, description: str, commit_data: Dict[str, int]) -> Dict[str, Any]:
    """
    Evaluates student contribution using AI.
    """
    system_prompt = "You are an academic evaluator."
    user_prompt = f"""
Evaluate the student contribution.

Phase: {phase}

Submission:
{description}

GitHub analysis:
{json.dumps(commit_data, indent=2)}

Return JSON:
{{
"score": 0-100,
"feedback": ""
}}
"""
    raw_response = _chat(system_prompt, user_prompt)
    evaluation = _parse_json_response(raw_response)
    
    return evaluation

def generate_team_summary(phase_data: List[Dict[str, Any]], team_members: List[str]) -> Dict[str, str]:
    """
    Generates a summary of the team's overall performance using AI.
    """
    system_prompt = "You are an academic evaluator."
    user_prompt = f"""
Analyze the following project contributions and summarize the team's overall performance.

Team Members: {', '.join(team_members)}

Project Phase Data:
{json.dumps(phase_data, indent=2)}

Return a short summary highlighting:
- strongest contributor
- weakest contributor
- team collaboration quality

Return JSON:
{{
"summary": ""
}}
"""
    raw_response = _chat(system_prompt, user_prompt)
    summary = _parse_json_response(raw_response)
    return summary
