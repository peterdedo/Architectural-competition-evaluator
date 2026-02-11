# Jednoduchý výpočet váženého skóre (Python port z EvaluationEngine)

def normalize_value(value, indikator_dict, max_ref=100):
    """Normalizuje hodnotu indikátora na 0–100. Pre lower_better invertujeme."""
    try:
        v = float(value) if value not in (None, "") else 0
    except (TypeError, ValueError):
        return 0
    if not (v >= 0):
        return 0
    max_val = indikator_dict.get("max") or max_ref
    if max_val <= 0:
        return 0
    norm = min((v / max_val) * 100, 100)
    if indikator_dict.get("lower_better", False):
        norm = 100 - norm
    return round(norm, 2)


def calculate_project_score(project_values, category_weights, indicator_weights):
    """
    project_values: dict { "U01": 5000, "U02": 1200, ... }
    category_weights: dict { "vyuziti-uzemi": 25, ... }  (percentá kategórií)
    indicator_weights: dict { "vyuziti-uzemi": { "U01": 10, "U02": 20, ... }, ... }
    """
    from data import get_indikatory_by_kategorie
    import math

    ind_by_cat = get_indikatory_by_kategorie()
    total_weighted = 0.0
    total_possible = 0.0

    for cat_id, cat_weight_pct in (category_weights or {}).items():
        if cat_weight_pct <= 0:
            continue
        indicators = ind_by_cat.get(cat_id, [])
        ind_weights = (indicator_weights or {}).get(cat_id) or {}

        for ind in indicators:
            iid = ind["id"]
            iw = ind_weights.get(iid) or ind.get("vaha") or 0
            if iw <= 0:
                continue
            val = project_values.get(iid)
            norm = normalize_value(val, ind)
            part = (norm / 100) * (iw / 100) * (cat_weight_pct / 100)
            if math.isfinite(part):
                total_weighted += part
                total_possible += (iw / 100) * (cat_weight_pct / 100)

    if total_possible <= 0:
        return 0.0
    return round((total_weighted / total_possible) * 100, 2)
