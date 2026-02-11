# Parsovanie CSV a JSON do zoznamu projektov (kompatibilné s React appkou)
import csv
import json
import io
from typing import List, Dict, Any

from data import INDIKATORY

# Mapovanie názvu stĺpca / kľúča na id indikátora (pre CSV hlavičky)
IND_IDS = {i["id"] for i in INDIKATORY}
# Alternatíva: názov bez diakritiky alebo skratka
NAZOV_TO_ID = {i["nazev"].strip(): i["id"] for i in INDIKATORY}
NAZOV_TO_ID.update({i["id"]: i["id"] for i in INDIKATORY})


def _normalize_value(v: Any) -> float:
    if v is None or v == "":
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, dict) and "value" in v:
        return float(v.get("value", 0) or 0)
    try:
        return float(str(v).replace(" ", "").replace(",", "."))
    except (ValueError, TypeError):
        return 0.0


def parse_csv(content: str, filename: str = "upload") -> List[Dict[str, Any]]:
    """
    CSV: prvý stĺpec = názov projektu (nazev), ostatné = id indikátorov (U01, F01, ...).
    Jeden riadok = jeden projekt. Hlavička = názvy stĺpcov.
    """
    reader = csv.reader(io.StringIO(content))
    rows = list(reader)
    if len(rows) < 2:
        return []
    headers = [h.strip() for h in rows[0]]
    nazev_col = 0  # prvý stĺpec = názov projektu
    projects = []
    for i, row in enumerate(rows[1:]):
        if len(row) < len(headers):
            row = row + [""] * (len(headers) - len(row))
        nazev = (row[nazev_col].strip() if nazev_col < len(row) else "") or f"{filename}_{i+1}"
        if not nazev:
            nazev = f"{filename}_{i+1}"
        data = {}
        for j, header in enumerate(headers):
            if j == nazev_col:
                continue
            ind_id = header.strip()
            if ind_id not in IND_IDS:
                ind_id = NAZOV_TO_ID.get(ind_id, ind_id)
            if ind_id in IND_IDS:
                val = _normalize_value(row[j] if j < len(row) else "")
                if val != 0 or ind_id in data:
                    data[ind_id] = val
        projects.append({"id": f"{filename}_{i}", "nazev": nazev, "data": data})
    return projects


def parse_json(content: str, filename: str = "upload") -> List[Dict[str, Any]]:
    """
    JSON: buď pole { "projects": [ { "nazev": "...", "data": { "U01": 5000 } } ] }
    alebo pole [ { "nazev": "...", "data": {} } ] alebo jeden objekt { "nazev": "...", "data": {} }.
    """
    try:
        obj = json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Neplatný JSON: {e}")
    out = []
    if isinstance(obj, list):
        for i, item in enumerate(obj):
            nazev = item.get("nazev") or item.get("name") or f"{filename}_{i}"
            data_raw = item.get("data") or item
            data = {}
            for k, v in data_raw.items():
                if k in ("nazev", "name", "id"):
                    continue
                if k in IND_IDS:
                    data[k] = _normalize_value(v)
                elif k in NAZOV_TO_ID:
                    data[NAZOV_TO_ID[k]] = _normalize_value(v)
            out.append({"id": f"{filename}_{i}", "nazev": str(nazev), "data": data})
    elif isinstance(obj, dict):
        if "projects" in obj:
            for i, item in enumerate(obj["projects"]):
                nazev = item.get("nazev") or item.get("name") or f"{filename}_{i}"
                data_raw = item.get("data") or item
                data = {}
                for k, v in data_raw.items():
                    if k in ("nazev", "name", "id"):
                        continue
                    if k in IND_IDS:
                        data[k] = _normalize_value(v)
                    elif k in NAZOV_TO_ID:
                        data[NAZOV_TO_ID[k]] = _normalize_value(v)
                out.append({"id": f"{filename}_{i}", "nazev": str(nazev), "data": data})
        else:
            nazev = obj.get("nazev") or obj.get("name") or filename
            data = {}
            for k, v in obj.items():
                if k in ("nazev", "name", "id"):
                    continue
                if k in IND_IDS:
                    data[k] = _normalize_value(v)
                elif k in NAZOV_TO_ID:
                    data[NAZOV_TO_ID[k]] = _normalize_value(v)
            if "data" in obj:
                for k, v in (obj["data"] or {}).items():
                    if k in IND_IDS:
                        data[k] = _normalize_value(v)
            out.append({"id": f"{filename}_0", "nazev": str(nazev), "data": data})
    return out
