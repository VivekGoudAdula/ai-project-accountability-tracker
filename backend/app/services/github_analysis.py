import os
import logging
import httpx
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_API_BASE = "https://api.github.com"

def _get_headers() -> dict:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


def _parse_owner_repo(repo_url: str) -> tuple[str, str]:
    """
    Parses a GitHub repository URL into (owner, repo).
    Supports:
      - https://github.com/owner/repo
      - https://github.com/owner/repo.git
      - owner/repo
    """
    url = repo_url.strip().rstrip("/").removesuffix(".git")
    if "github.com" in url:
        parts = url.split("github.com/")[-1].split("/")
    else:
        parts = url.split("/")
    if len(parts) < 2:
        raise ValueError(f"Cannot parse GitHub repo URL: {repo_url}")
    return parts[0], parts[1]


def analyze_github_repo(repo_url: str) -> dict:
    """
    Fetches repository metadata, commits, and contributor stats from the GitHub API.

    Returns a structured dict with:
      - repo_info: basic metadata
      - top_contributor: login of the user with the most commits
      - contributors: list of {login, contributions}
      - recent_commits: list of {sha, author, message, date}
      - files_changed_estimate: total additions + deletions from recent commits
      - analysis_summary: plain text summary
    """
    try:
        owner, repo = _parse_owner_repo(repo_url)
    except ValueError as e:
        return {"error": str(e)}

    with httpx.Client(headers=_get_headers(), timeout=15.0) as client:
        # 1. Repository metadata
        repo_resp = client.get(f"{GITHUB_API_BASE}/repos/{owner}/{repo}")
        if repo_resp.status_code != 200:
            return {
                "error": f"GitHub API error {repo_resp.status_code}: {repo_resp.text}",
                "repo_url": repo_url,
            }
        repo_info = repo_resp.json()

        # 2. Contributor stats
        contrib_resp = client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contributors",
            params={"per_page": 10},
        )
        contributors = []
        top_contributor = None
        if contrib_resp.status_code == 200:
            for c in contrib_resp.json():
                contributors.append({
                    "login": c.get("login"),
                    "contributions": c.get("contributions", 0),
                    "avatar_url": c.get("avatar_url"),
                    "html_url": c.get("html_url"),
                })
            if contributors:
                top_contributor = contributors[0]["login"]  # sorted desc by contributions

        # 3. Recent commits (last 20)
        commits_resp = client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/commits",
            params={"per_page": 20},
        )
        recent_commits = []
        files_changed_estimate = 0
        if commits_resp.status_code == 200:
            for commit in commits_resp.json():
                author = (
                    commit.get("author", {}) or {}
                ).get("login") or (
                    commit.get("commit", {}).get("author", {}).get("name")
                )
                recent_commits.append({
                    "sha": commit.get("sha", "")[:7],
                    "author": author,
                    "message": commit.get("commit", {}).get("message", ""),
                    "date": commit.get("commit", {}).get("author", {}).get("date"),
                })

        # 4. Build summary
        total_commits = repo_info.get("size", 0)  # rough proxy
        summary_lines = [
            f"Repository: {owner}/{repo}",
            f"Stars: {repo_info.get('stargazers_count', 0)}  |  Forks: {repo_info.get('forks_count', 0)}",
            f"Default branch: {repo_info.get('default_branch', 'main')}",
            f"Language: {repo_info.get('language', 'Unknown')}",
            f"Contributors analyzed: {len(contributors)}",
        ]
        if top_contributor:
            summary_lines.append(f"Top contributor: @{top_contributor}")
        if recent_commits:
            summary_lines.append(f"Recent commits sampled: {len(recent_commits)}")

        return {
            "repo_info": {
                "full_name": repo_info.get("full_name"),
                "description": repo_info.get("description"),
                "language": repo_info.get("language"),
                "stars": repo_info.get("stargazers_count"),
                "forks": repo_info.get("forks_count"),
                "open_issues": repo_info.get("open_issues_count"),
                "default_branch": repo_info.get("default_branch"),
                "html_url": repo_info.get("html_url"),
            },
            "top_contributor": top_contributor,
            "contributors": contributors,
            "recent_commits": recent_commits,
            "analysis_summary": "\n".join(summary_lines),
        }

def get_commit_counts(repo_url: str) -> dict:
    """
    Counts commits per contributor for a given repository.
    Example output: {"vivek": 25, "rohit": 14, "ankit": 7}
    """
    try:
        owner, repo = _parse_owner_repo(repo_url)
    except ValueError:
        return {}

    with httpx.Client(headers=_get_headers(), timeout=15.0) as client:
        # Get contributors with contribution counts
        resp = client.get(f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contributors")
        if resp.status_code != 200:
            return {}
        
        counts = {}
        for contributor in resp.json():
            login = contributor.get("login")
            contributions = contributor.get("contributions", 0)
            counts[login] = contributions
            
        return counts
