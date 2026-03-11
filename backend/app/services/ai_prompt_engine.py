import os
import json
import logging
from typing import Optional
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

_client: Optional[Groq] = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not set in environment variables.")
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


def _chat(system_prompt: str, user_prompt: str) -> str:
    """
    Internal helper that calls Groq and returns the raw text response.
    """
    client = _get_client()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


def _parse_json_response(raw: str) -> dict:
    """
    Attempts to extract and parse a JSON object from the LLM's response.
    Handles cases where the model wraps JSON in markdown code fences.
    """
    # Strip markdown code fences if present
    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            stripped = part.strip().lstrip("json").strip()
            if stripped.startswith("{"):
                raw = stripped
                break
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse JSON from LLM response: %s\nRaw: %s", e, raw)
        return {"error": "Failed to parse AI response", "raw": raw}


# ─── Task Division Engine ─────────────────────────────────────────────────────

TASK_DIVISION_SYSTEM = (
    "You are a senior academic project manager. "
    "When asked to divide project work, respond ONLY with a valid JSON object. "
    "No explanation, no markdown, no preamble."
)


def divide_tasks_for_phase(phase: str, project_description: str = "") -> dict:
    """
    Uses Groq to divide the current phase work among 3 team members.

    Returns a dict with keys: member1_task, member2_task, member3_task.
    """
    user_prompt = (
        f"Divide the following project phase work among 3 team members.\n\n"
        f"Phase: {phase}\n"
        f"Project Description: {project_description or 'General academic project'}\n\n"
        f"Return ONLY a JSON object with exactly these keys:\n"
        f'{{"member1_task": "...", "member2_task": "...", "member3_task": "..."}}'
    )
    raw = _chat(TASK_DIVISION_SYSTEM, user_prompt)
    return _parse_json_response(raw)


# ─── Submission Evaluation Engine ─────────────────────────────────────────────

EVALUATION_SYSTEM = (
    "You are a strict but fair academic evaluator. "
    "Evaluate student submissions objectively. "
    "Respond ONLY with a valid JSON object. No explanation, no markdown."
)


def evaluate_submission(
    phase: str,
    tasks_done: str,
    evidence_link: Optional[str] = None,
    hours_spent: float = 0.0,
) -> dict:
    """
    Uses Groq to evaluate a student submission.

    Returns a dict with keys:
        contribution_score (0-100),
        consistency_score  (0-100),
        freeload_risk      (0-100, higher = riskier),
        pattern            (string label, e.g. "Consistent", "Last-minute"),
        summary            (brief feedback string)
    """
    evidence_str = evidence_link if evidence_link else "No evidence provided"
    user_prompt = (
        f"Evaluate the following student submission.\n\n"
        f"Phase: {phase}\n"
        f"Tasks Completed: {tasks_done}\n"
        f"Hours Spent: {hours_spent}\n"
        f"Evidence: {evidence_str}\n\n"
        f"Return ONLY a JSON object with exactly these keys:\n"
        f'{{"contribution_score": <0-100>, "consistency_score": <0-100>, '
        f'"freeload_risk": "Low | Medium | High", "feedback": "<summary>"}}'
    )
    raw = _chat(EVALUATION_SYSTEM, user_prompt)
    return _parse_json_response(raw)
