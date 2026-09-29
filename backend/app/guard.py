import re
from typing import Tuple, List

# Regex patterns for detecting prompt injection & jailbreak attempts
INJECTION_PATTERNS = [
    (r"ignore\s+(all\s+)?(previous|prior|above|system)\s+(instructions|rules|prompts|directives)", "INSTRUCTION_OVERRIDE"),
    (r"disregard\s+(all\s+)?(previous|prior|above|system)\s+(instructions|rules|prompts|directives)", "INSTRUCTION_OVERRIDE"),
    (r"forget\s+(all\s+)?(previous|prior|above|system)\s+(instructions|rules|prompts|directives)", "INSTRUCTION_OVERRIDE"),
    (r"(override|bypass|ignore)\s+(the\s+)?(refund\s+)?policy", "POLICY_BYPASS"),
    (r"(set|change|mark|make)\s+(the\s+)?(status|decision)\s+(to\s+)?(approved|denied|escalated|refunded)", "STATUS_MANIPULATION"),
    (r"grant\s+(a\s+)?(full\s+)?refund\s+(regardless|anyway|now|immediately)", "FORCED_DECISION"),
    (r"(act|pretend|behave)\s+as\s+(an?\s+)?(admin|developer|root|super\s*user|god\s*mode|dan)", "PERSONA_JAILBREAK"),
    (r"you\s+are\s+now\s+in\s+(developer|debug|admin|dan|jailbreak)\s+mode", "MODE_JAILBREAK"),
    (r"(output|reveal|show|print)\s+(your|the)\s+(system\s+prompt|hidden\s+instructions|secret\s+rules)", "SYSTEM_PROMPT_LEAK"),
    (r"(system_override|admin_override|root_access|prompt_injection|jailbreak)", "EXPLICIT_ATTACK_KEYWORD"),
    (r"<\/?[a-z]+[^>]*>.*system", "HTML_TAG_INJECTION"),
    (r"\[SYSTEM\]|\[ADMIN\]|\[DEVELOPER\]", "SYSTEM_HEADER_SPOOFING"),
]


class PromptInjectionGuard:
    """
    Regex and heuristic security guard to intercept prompt injection and jailbreak
    attempts before user inputs are processed by the LLM or policy engine.
    """

    def __init__(self):
        self.compiled_patterns = [(re.compile(pat, re.IGNORECASE), name) for pat, name in INJECTION_PATTERNS]

    def analyze(self, text: str) -> Tuple[bool, List[str], float]:
        """
        Analyzes the text for prompt injection patterns.
        
        Returns:
            (is_injection: bool, detected_patterns: List[str], risk_score: float)
        """
        if not text:
            return False, [], 0.0

        matches = []
        for regex, name in self.compiled_patterns:
            found = regex.findall(text)
            if found:
                matches.append(name)

        # Remove duplicate pattern names while preserving order
        unique_matches = list(dict.fromkeys(matches))

        is_injection = len(unique_matches) > 0
        risk_score = min(1.0, len(unique_matches) * 0.4)

        return is_injection, unique_matches, risk_score


# Global instance
guard = PromptInjectionGuard()
