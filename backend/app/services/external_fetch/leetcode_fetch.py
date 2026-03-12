import json
import httpx
from datetime import datetime

_URL = "https://leetcode.com/graphql"
_CURRENT_YEAR = datetime.utcnow().year
_PREV_YEAR = _CURRENT_YEAR - 1
_HEADERS = {
    "Content-Type": "application/json",
    "Referer": "https://leetcode.com",
}

_PROFILE_QUERY = """
query getUserProfile($username: String!, $year: Int!, $prevYear: Int!) {
  matchedUser(username: $username) {
    username
    profile {
      ranking
      reputation
      realName
      aboutMe
      userAvatar
      countryName
      skillTags
    }
    submitStats {
      acSubmissionNum { difficulty count }
    }
    problemsSolvedBeatsStats { difficulty percentage }
    userCalendar(year: $year) {
      streak
      totalActiveDays
      submissionCalendar
    }
    prevCalendar: userCalendar(year: $prevYear) {
      submissionCalendar
    }
    badges { id name shortName icon }
    languageProblemCount { languageName problemsSolved }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
  }
}
"""

_CONTEST_QUERY = """
query getUserContestRanking($username: String!) {
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    topPercentage
  }
  userContestRankingHistory(username: $username) {
    attended
    rating
    ranking
    contest { title startTime }
  }
}
"""


async def fetch_leetcode(username: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            r1 = await client.post(
                _URL,
                json={"query": _PROFILE_QUERY, "variables": {"username": username, "year": _CURRENT_YEAR, "prevYear": _PREV_YEAR}},
                headers=_HEADERS,
            )
            if r1.status_code != 200:
                return {"error": "Failed to fetch LeetCode profile"}

            d1 = r1.json()
            user = (d1.get("data") or {}).get("matchedUser")
            if not user:
                return {"error": "User not found"}

            try:
                r2 = await client.post(
                    _URL,
                    json={"query": _CONTEST_QUERY, "variables": {"username": username}},
                    headers=_HEADERS,
                )
                d2 = r2.json() if r2.status_code == 200 else {}
            except Exception:
                d2 = {}

        # ── Parse stats ──────────────────────────────────────────
        profile = user["profile"]
        stats_raw = (user.get("submitStats") or {}).get("acSubmissionNum") or []
        diff_map = {s["difficulty"]: s["count"] for s in stats_raw}

        beats_raw = user.get("problemsSolvedBeatsStats") or []
        beats_map = {b["difficulty"]: round(b["percentage"], 1) for b in beats_raw}

        # ── Calendar ─────────────────────────────────────────────
        cal_data = user.get("userCalendar") or {}
        streak = cal_data.get("streak", 0)
        total_active_days = cal_data.get("totalActiveDays", 0)
        cal_raw = cal_data.get("submissionCalendar", "{}")
        try:
            submission_calendar = json.loads(cal_raw) if isinstance(cal_raw, str) else (cal_raw or {})
        except Exception:
            submission_calendar = {}

        # Merge previous year calendar so 12-month rolling views have full data
        prev_cal_raw = (user.get("prevCalendar") or {}).get("submissionCalendar", "{}")
        try:
            prev_cal = json.loads(prev_cal_raw) if isinstance(prev_cal_raw, str) else (prev_cal_raw or {})
        except Exception:
            prev_cal = {}
        # Current year takes precedence on any key collision
        submission_calendar = {**prev_cal, **submission_calendar}

        # ── Badges ───────────────────────────────────────────────
        def _fix_icon(url: str) -> str:
            if not url:
                return ""
            if url.startswith("http"):
                return url
            return "https://leetcode.com" + url

        badges = [
            {"name": b["name"], "icon": _fix_icon(b.get("icon") or ""), "id": b.get("id")}
            for b in (user.get("badges") or [])
        ]

        # ── Languages ────────────────────────────────────────────
        lang_raw = user.get("languageProblemCount") or []
        languages = sorted(
            [{"name": l["languageName"], "count": l["problemsSolved"]} for l in lang_raw],
            key=lambda x: x["count"],
            reverse=True,
        )[:10]

        # ── Topic tags ───────────────────────────────────────────
        tags_data = user.get("tagProblemCounts") or {}
        topic_tags = {
            "advanced": [{"name": t["tagName"], "count": t["problemsSolved"]}
                         for t in (tags_data.get("advanced") or [])[:10]],
            "intermediate": [{"name": t["tagName"], "count": t["problemsSolved"]}
                             for t in (tags_data.get("intermediate") or [])[:10]],
            "fundamental": [{"name": t["tagName"], "count": t["problemsSolved"]}
                            for t in (tags_data.get("fundamental") or [])[:10]],
        }

        # ── Contest ──────────────────────────────────────────────
        cd = (d2.get("data") or {})
        cr = cd.get("userContestRanking") or {}
        hist_raw = cd.get("userContestRankingHistory") or []
        contest_history = [
            {
                "attended": h.get("attended"),
                "rating": h.get("rating"),
                "ranking": h.get("ranking"),
                "title": (h.get("contest") or {}).get("title"),
                "start_time": (h.get("contest") or {}).get("startTime"),
            }
            for h in hist_raw
            if h.get("attended")
        ][-20:]

        return {
            "username": user["username"],
            "real_name": profile.get("realName"),
            "ranking": profile.get("ranking"),
            "reputation": profile.get("reputation"),
            "about": profile.get("aboutMe"),
            "avatar": profile.get("userAvatar"),
            "country": profile.get("countryName"),
            "skill_tags": profile.get("skillTags") or [],
            "total_solved": diff_map.get("All", 0),
            "easy_solved": diff_map.get("Easy", 0),
            "medium_solved": diff_map.get("Medium", 0),
            "hard_solved": diff_map.get("Hard", 0),
            "beats_easy": beats_map.get("Easy"),
            "beats_medium": beats_map.get("Medium"),
            "beats_hard": beats_map.get("Hard"),
            "streak": streak,
            "total_active_days": total_active_days,
            "submission_calendar": submission_calendar,
            "badges": badges,
            "languages": languages,
            "topic_tags": topic_tags,
            "contest": {
                "rating": cr.get("rating"),
                "global_ranking": cr.get("globalRanking"),
                "top_percentage": cr.get("topPercentage"),
                "attended_count": cr.get("attendedContestsCount"),
            },
            "contest_history": contest_history,
            "updated_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        return {"error": str(e)}

