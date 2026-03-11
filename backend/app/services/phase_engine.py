from datetime import datetime, timezone
from typing import Optional

# ─── Phase Map ────────────────────────────────────────────────────────────────
# Week number → Phase name mapping (academic calendar)
PHASE_MAP: dict[int, str] = {
    6:  "Literature Survey",
    7:  "Project Design",
    8:  "Implementation",
    9:  "Project Report",
    10: "Presentation",
    11: "Evaluation",
}

# The academic start week (ISO week number of the first tracked week)
# Set this to match your institution's schedule. 
# Week 6 of 2026 → ISO week 6 starts on Feb 2, 2026.
# Adjust ACADEMIC_START_ISO_WEEK to the ISO week that corresponds to "Week 6".
ACADEMIC_START_ISO_WEEK: int = int(6)
ACADEMIC_START_YEAR: int = 2026


def _get_current_iso_week() -> tuple[int, int]:
    """Returns (iso_year, iso_week) for today in UTC."""
    now = datetime.now(tz=timezone.utc)
    iso = now.isocalendar()
    return iso.year, iso.week


def get_week_number() -> int:
    """
    Returns the logical academic week number (6–11) based on the current ISO week.
    Returns -1 if we're outside the tracked range.
    """
    _, iso_week = _get_current_iso_week()
    # The offset maps ISO week → academic week number.
    # If ACADEMIC_START_ISO_WEEK is 6, then ISO week 6 → academic week 6,
    # ISO week 7 → academic week 7, etc.
    academic_week = iso_week - ACADEMIC_START_ISO_WEEK + 6
    return academic_week if academic_week in PHASE_MAP else -1


def get_current_phase() -> Optional[str]:
    """
    Returns the current academic phase name based on the current week.
    Returns None if we're outside the tracked phase window.
    """
    week = get_week_number()
    return PHASE_MAP.get(week)


def is_submission_open() -> bool:
    """
    Submissions are open from Monday 00:00:00 to Sunday 23:59:59 UTC.
    Returns False if we're outside the valid phase window.
    Also returns False if the deadline (Sunday 23:59:59) has passed for this week.
    """
    week = get_week_number()
    if week not in PHASE_MAP:
        return False  # Outside tracked phase range

    now = datetime.now(tz=timezone.utc)
    # ISO weekday: Monday=1 … Sunday=7
    # Submissions are always open within Monday–Sunday of the current phase week.
    # Since get_week_number() already confirms we're in a valid week, just confirm
    # we haven't crossed Sunday midnight.
    iso_weekday = now.isoweekday()  # 1=Mon, 7=Sun
    if iso_weekday < 7:
        return True  # Mon–Sat: always open
    # Sunday: check time component
    if now.hour < 23:
        return True
    if now.hour == 23 and now.minute < 59:
        return True
    if now.hour == 23 and now.minute == 59 and now.second <= 59:
        return True
    return False  # Sunday 23:59:59 or later → deadline passed


def get_phase_info() -> dict:
    """
    Returns a summary dict for use in API responses and dashboard.
    """
    week = get_week_number()
    phase = get_current_phase()
    open_ = is_submission_open()
    return {
        "week_number": week,
        "current_phase": phase or "Out of phase window",
        "submission_open": open_,
        "phase_map": PHASE_MAP,
    }
