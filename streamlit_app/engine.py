# Výpočet skóre – presne ako v pôvodnej React aplikácii (StepResults, ComparisonDashboard)
# Normalizácia: (value / max) * 100 per indikátor. Skóre: sum(norm * weight) / sum(weight) * 100.
# vahy = flat dict ind_id -> weight (default 10)
from typing import List, Dict, Any, Optional

from data import INDIKATORY, get_indikatory_by_kategorie


def _extract_value(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)) and not (value != value):  # not NaN
        return float(value)
    if isinstance(value, dict) and "value" in value:
        return _extract_value(value["value"])
    try:
        s = str(value).strip().replace(",", ".")
        if not s:
            return None
        return float(s)
    except (ValueError, TypeError):
        return None


def compute_scores_like_react(
    projects: List[Dict[str, Any]],
    indicators: List[Dict],  # len vybrané indikátory s id, vaha, lower_better
    vahy: Dict[str, float],  # ind_id -> weight (default 10)
) -> List[Dict[str, Any]]:
    """
    Rovnaký výpočet ako v React StepResults / ComparisonDashboard:
    - Pre každý indikátor: normalizedValue = (actualValue / max) * 100 (max cez projekty)
    - Pre lower_better: v UI sa zvyčajne berie min ako „najlepší“, ale normalizácia zostáva value/max
    - totalScore += normalizedValue * (weight/100), totalWeight += weight
    - weightedScore = (totalScore / totalWeight) * 100
    """
    if not projects or not indicators:
        return []

    ind_ids = [i["id"] for i in indicators]
    result = []

    for project in projects:
        data = project.get("data") or {}
        total_score = 0.0
        total_weight = 0.0
        filled_count = 0

        for ind in indicators:
            iid = ind["id"]
            weight = vahy.get(iid) if vahy else None
            if weight is None:
                weight = ind.get("vaha", 10)
            weight = max(0, float(weight))

            raw = data.get(iid)
            actual = _extract_value(raw)
            if actual is None:
                continue

            filled_count += 1
            # Všetky hodnoty tohto indikátora cez projekty
            all_vals = []
            for p in projects:
                v = _extract_value((p.get("data") or {}).get(iid))
                if v is not None:
                    all_vals.append(v)
            if not all_vals:
                continue
            max_val = max(all_vals)
            if max_val > 0:
                normalized = (actual / max_val) * 100
            else:
                normalized = 100.0 if actual else 0.0
            # lower_better sa v pôvodnej appke používa len na zvýraznenie „najlepšej“ hodnoty (min), nie na invert skóre
            total_score += normalized * (weight / 100)
            total_weight += weight

        completion = (filled_count / len(indicators) * 100) if indicators else 0
        weighted_score = (total_score / total_weight * 100) if total_weight > 0 else 0.0

        result.append({
            **project,
            "weightedScore": round(weighted_score, 2),
            "completionRate": round(completion, 0),
            "filledIndicators": filled_count,
            "totalIndicators": len(indicators),
        })

    result.sort(key=lambda x: x["weightedScore"], reverse=True)
    return result


def get_normalized_values_for_heatmap(
    projects: List[Dict], indicators: List[Dict]
) -> List[Dict[str, Any]]:
    """Pre každý projekt vráti dict ind_id -> normalized 0–100 (value/max)."""
    out = []
    for p in projects:
        data = p.get("data") or {}
        row = {"nazev": p.get("nazev", ""), "id": p.get("id", "")}
        for ind in indicators:
            iid = ind["id"]
            actual = _extract_value(data.get(iid))
            if actual is None:
                row[iid] = None
                continue
            all_vals = []
            for pr in projects:
                v = _extract_value((pr.get("data") or {}).get(iid))
                if v is not None:
                    all_vals.append(v)
            if not all_vals:
                row[iid] = 0
                continue
            mx = max(all_vals)
            if mx > 0:
                norm = (actual / mx) * 100
            else:
                norm = 100.0
            if ind.get("lower_better"):
                norm = 100 - norm
            row[iid] = round(norm, 1)
        out.append(row)
    return out


def get_best_value(indicator_id: str, projects: List[Dict], lower_better: bool) -> Optional[float]:
    vals = []
    for p in projects:
        v = _extract_value((p.get("data") or {}).get(indicator_id))
        if v is not None:
            vals.append(v)
    if not vals:
        return None
    return min(vals) if lower_better else max(vals)
