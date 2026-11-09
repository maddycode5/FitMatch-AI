import re
from typing import Dict, Any, List, Optional

# Physiological Anthropometric Bounds (in cm)
MEASUREMENT_BOUNDS = {
    "chest_cm": {"min": 60, "max": 160, "label": "Chest / Bust"},
    "waist_cm": {"min": 50, "max": 150, "label": "Waistline"},
    "shoulder_cm": {"min": 32, "max": 65, "label": "Shoulder Width"},
    "neck_cm": {"min": 28, "max": 55, "label": "Neck Circumference"},
    "hip_cm": {"min": 65, "max": 160, "label": "Hips / Seat"},
    "inseam_cm": {"min": 55, "max": 110, "label": "Inseam (Inner Leg)"},
    "height_cm": {"min": 120, "max": 230, "label": "Total Height"}
}

# English & Hindi/Hinglish aliases for dimensions
DIMENSION_ALIASES = {
    "chest_cm": [
        "chest", "bust", "pecs", "chess", "chast", "around chest", "chest size", 
        "chhati", "seena", "chaati", "chest measurement"
    ],
    "waist_cm": [
        "waist", "waistline", "waste", "stomach", "belly", "around waist", 
        "kamar", "pet", "waist measurement"
    ],
    "shoulder_cm": [
        "shoulder", "shoulders", "shoulder width", "across shoulders", "sholder", 
        "kandha", "kandhe", "kandho"
    ],
    "neck_cm": [
        "neck", "collar", "around neck", "neck circumference", "neck size", 
        "gala", "gale", "kanth"
    ],
    "hip_cm": [
        "hip", "hips", "seat", "buttocks", "around hips", "kulhe", "hips size"
    ],
    "inseam_cm": [
        "inseam", "in seam", "inner leg", "crotch to ankle", "pant length", 
        "pair", "taang", "inside leg"
    ],
    "height_cm": [
        "height", "tall", "stature", "lambai", "kad", "kadd"
    ]
}

# Number words mapping (English + Hindi transliteration)
NUMBER_WORDS = {
    # English
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9,
    "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16,
    "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
    "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90, "hundred": 100, "point": ".", "half": 0.5,
    # Hindi / Hinglish numerals
    "ek": 1, "do": 2, "teen": 3, "chaar": 4, "paanch": 5, "chhe": 6, "saat": 7, "aath": 8, "nau": 9, "das": 10,
    "bees": 20, "tees": 30, "chaalis": 40, "pachaas": 50, "saath": 60, "sattar": 70, "assi": 80, "nabbe": 90,
    "sau": 100, "athaanve": 98, "athaanvey": 98, "bayaanve": 92, "bayaanvey": 92, "chhiyaanve": 96
}

def parse_spoken_number(text_segment: str) -> Optional[float]:
    """Extracts a numeric float from digits or spoken words."""
    # Direct digit match (e.g. 98, 98.5)
    digit_match = re.search(r"(\d+(\.\d+)?)", text_segment)
    if digit_match:
        try:
            return float(digit_match.group(1))
        except ValueError:
            pass

    # Spoken number word parser
    words = re.split(r"[\s-]+", text_segment.lower())
    accumulated = 0
    found = False

    for w in words:
        if w in NUMBER_WORDS:
            found = True
            val = NUMBER_WORDS[w]
            if val == 100:
                accumulated = (accumulated or 1) * 100
            else:
                accumulated += val

    return float(accumulated) if found and accumulated > 0 else None

def extract_measurements(transcript: str, default_dimension: str = "chest_cm") -> Dict[str, Any]:
    """
    Parses spoken natural language transcript into structured biometric measurements.
    Supports single or multiple measurements in a single utterance:
    Example: "My chest is 98 centimetres and my waist is 82 centimetres."
    """
    if not transcript or not isinstance(transcript, str):
        return {
            "success": False,
            "intent": "empty",
            "transcript": "",
            "measurements": []
        }

    clean = transcript.lower().strip()

    # 1. Detect Confirmation Intent (English + Hindi/Hinglish)
    if re.search(r"\b(confirm|yes|correct|save|lock it|good|that is right|approve|done|proceed|sahi hai|haan|theek hai|bilkul)\b", clean) and not re.search(r"\d+", clean):
        return {
            "success": True,
            "intent": "confirm",
            "transcript": transcript,
            "measurements": []
        }

    # 2. Detect Rejection Intent
    if re.search(r"\b(cancel|no|wrong|redo|clear|stop|reject|repeat|nahi|galat|dobara|badlo)\b", clean) and not re.search(r"\d+", clean):
        return {
            "success": True,
            "intent": "reject",
            "transcript": transcript,
            "measurements": []
        }

    # 3. Multi-Clause Splitting (e.g. "... and ...", "... aur ...", commas)
    clauses = re.split(r"\b(and|aur|also|then|,|\.)\b", clean)
    clauses = [c.strip() for c in clauses if c and c not in ("and", "aur", "also", "then", ",", ".")]
    if not clauses:
        clauses = [clean]

    detected_measurements = []

    for clause in clauses:
        # Detect targeted dimension in this clause
        matched_dimension = None
        longest_alias = 0

        for dim_key, aliases in DIMENSION_ALIASES.items():
            for alias in aliases:
                pattern = rf"(^|\s|[^a-zA-Z0-9]){re.escape(alias)}($|\s|[^a-zA-Z0-9])"
                if re.search(pattern, clause):
                    if len(alias) > longest_alias:
                        matched_dimension = dim_key
                        longest_alias = len(alias)

        # Fallback to default active dimension if numbers are spoken without an explicit dimension name
        dim_key = matched_dimension or default_dimension

        # Extract numeric value
        value = parse_spoken_number(clause)
        if value is None:
            continue

        # Unit Conversion (Inches vs Centimetres)
        unit = "cm"
        value_cm = value

        if re.search(r"\b(inch|inches|inche)\b", clause):
            unit = "inches"
            value_cm = round(value * 2.54, 1)
        else:
            value_cm = round(value, 1)

        # Physiological Validation
        bounds = MEASUREMENT_BOUNDS.get(dim_key, {"min": 40, "max": 200, "label": "Measurement"})
        is_valid = bounds["min"] <= value_cm <= bounds["max"]
        warning = None
        if not is_valid:
            warning = f"{bounds['label']} of {value_cm} cm is outside typical physiological range ({bounds['min']} - {bounds['max']} cm)."

        detected_measurements.append({
            "dimensionKey": dim_key,
            "dimensionLabel": bounds["label"],
            "value_cm": value_cm,
            "originalValue": value,
            "unitSpoken": unit,
            "isValid": is_valid,
            "warning": warning,
            "bounds": bounds,
            "clauseText": clause
        })

    # If multi-clause failed to find numbers, try full string fallback
    if not detected_measurements:
        full_value = parse_spoken_number(clean)
        if full_value is not None:
            dim_key = default_dimension
            for d_key, aliases in DIMENSION_ALIASES.items():
                for alias in aliases:
                    if re.search(rf"(^|\s|[^a-zA-Z0-9]){re.escape(alias)}($|\s|[^a-zA-Z0-9])", clean):
                        dim_key = d_key
                        break

            unit = "inches" if re.search(r"\b(inch|inches)\b", clean) else "cm"
            val_cm = round(full_value * 2.54, 1) if unit == "inches" else round(full_value, 1)
            bounds = MEASUREMENT_BOUNDS.get(dim_key, {"min": 40, "max": 200, "label": "Measurement"})
            is_valid = bounds["min"] <= val_cm <= bounds["max"]

            detected_measurements.append({
                "dimensionKey": dim_key,
                "dimensionLabel": bounds["label"],
                "value_cm": val_cm,
                "originalValue": full_value,
                "unitSpoken": unit,
                "isValid": is_valid,
                "warning": None if is_valid else f"{bounds['label']} of {val_cm} cm is outside bounds.",
                "bounds": bounds,
                "clauseText": clean
            })

    # Build confirmation prompt for TTS
    confirmation_prompt = ""
    if detected_measurements:
        phrases = [f"{m['dimensionLabel']} is {m['value_cm']} centimetres" for m in detected_measurements if m['isValid']]
        if phrases:
            confirmation_prompt = "Your " + " and ".join(phrases) + ". Is that correct?"

    return {
        "success": len(detected_measurements) > 0,
        "intent": "measurement" if detected_measurements else "unknown",
        "transcript": transcript,
        "measurements": detected_measurements,
        "primaryMeasurement": detected_measurements[0] if detected_measurements else None,
        "confirmationPrompt": confirmation_prompt
    }

