import json
from typing import Dict, Any, List
from app.services.ai_prompt_engine import _chat, _parse_json_response

def evaluate_student_submission(
    phase: str, 
    description: str, 
    commit_data: Dict[str, int],
    project_title: str = "Unknown Project",
    extracted_text: str = ""
) -> Dict[str, Any]:
    """
    Evaluates student contribution using AI.
    """
    system_prompt = "You are an academic evaluator. You must respond ONLY with valid JSON. Do NOT include markdown fences, preambles, or explanations."
    user_prompt = f"""
Evaluate the student contribution with EXTREME STRICTNESS. Students often submit low-effort work; your job is to grade them accurately.

Phase: {phase}
Project Title: {project_title}

Submission Description & Uploaded Files:
{description}

Extracted Text from Uploads (First few pages):
{extracted_text if extracted_text else 'No text extracted (PDFs only) or no document uploaded.'}

GitHub analysis (May be empty/irrelevant for early phases):
{json.dumps(commit_data, indent=2)}

Stricter Grading Scale:
- 95-100: Exceptional, perfect alignment, high-quality evidence, and detailed description.
- 80-94: Very good, clear effort, relevant files.
- 60-79: Average/Pass, fulfills basic requirements but lacks detail or polish.
- 30-59: Poor, vague description, or files/images that are only tangentially related.
- 0-29: Irrelevant, empty, or malicious/fake submission.

Phase Specifics:
- Literature Survey: Must mention specific research papers, gaps, and relevance to the title.
- Project Design: MUST include UI mockups, schematics, or architecture diagrams.
- Implementation: GitHub evidence is THE PRIMARY PROOF. If a valid GitHub repository link is provided with recent commits, you MUST evaluate the work based on the repository description, languages, and commit messages provided in the 'GitHub Activity Context'. 
  - IMPORTANT: Do NOT deduct points for "missing files" or "no extracted text" if GitHub data is present. The GitHub repo IS the file.
  - IMPORTANT: A "Single Contributor" in the GitHub repo is NORMAL for student projects or individual tasks. Do NOT penalize for lack of other contributors.

Evaluation Criteria:
1. Is the submission relevant to the "{project_title}" project?
2. Evidence of work: For Implementation, evaluate the GitHub repo's substance (languages, complexity, commit messages). For other phases, prioritize uploaded files and description.
3. If this is "Project Design", do the files/description show actual design work? (Based on Visual Analysis labels provided).

Return ONLY JSON matching this format exactly:
{{
  "score": <integer from 0 to 100>,
  "feedback": "<concise, strict academic feedback explaining exactly why the specific score was given. Point out deficiencies.>"
}}
"""
    raw_response = _chat(system_prompt, user_prompt)
    evaluation = _parse_json_response(raw_response)
    
    return evaluation

def generate_team_summary(phase_data: List[Dict[str, Any]], team_members: List[str]) -> Dict[str, str]:
    """
    Generates a summary of the team's overall performance using AI.
    """
    system_prompt = "You are an academic evaluator. You must respond ONLY with valid JSON. Do NOT include markdown fences, preambles, or explanations."
    user_prompt = f"""
Analyze the following project contributions and summarize the team's overall performance.

Team Members: {', '.join(team_members)}

Project Phase Data:
{json.dumps(phase_data, indent=2)}

Return a short summary highlighting:
- strongest contributor
- weakest contributor
- team collaboration quality

Return ONLY JSON matching this format exactly:
{{
  "summary": "<your string evaluation>"
}}
"""
    raw_response = _chat(system_prompt, user_prompt)
    summary = _parse_json_response(raw_response)
    return summary
