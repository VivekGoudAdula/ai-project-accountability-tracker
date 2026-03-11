import os
import json
from typing import List, Dict
from app.services.ai_prompt_engine import _chat, _parse_json_response

def divide_phase_tasks(phase: str, members: List[str]) -> Dict[str, str]:
    """
    Divides work for a project phase among 3 team members using AI.
    """
    if len(members) < 3:
        # Pad with placeholders if fewer than 3 members
        members = (members + ["Member 1", "Member 2", "Member 3"])[:3]
    
    system_prompt = "You are a senior academic project manager."
    user_prompt = f"""
Divide the work for the following project phase among 3 team members.

Phase: {phase}

Members:
1. {members[0]}
2. {members[1]}
3. {members[2]}

Return JSON:
{{
"member1_task": "",
"member2_task": "",
"member3_task": ""
}}
"""
    raw_response = _chat(system_prompt, user_prompt)
    tasks = _parse_json_response(raw_response)
    
    # Map back to member names if needed, but the requirement specifically asks for member1_task etc.
    return tasks
