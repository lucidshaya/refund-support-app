from datetime import datetime, timezone
from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class PolicyEvaluationResult:
    status: str  # APPROVED, DENIED, ESCALATED
    matched_rule: str
    explanation: str
    reasoning_steps: List[str]


class RefundPolicyEngine:
    """
    Deterministic refund policy engine.
    This is the sole authority for making refund decisions (APPROVED, DENIED, ESCALATED).
    """

    MAX_RETURN_AGE_DAYS = 30
    HIGH_VALUE_THRESHOLD = 500.0
    HIGH_RISK_REFUND_LIMIT = 4

    def evaluate(
        self,
        customer_risk_score: float,
        customer_refund_count: int,
        purchase_date: datetime,
        order_total: float,
        item_price: float,
        is_final_sale: bool,
        reason_category: str,
        is_injection: bool = False,
        injection_patterns: List[str] = None,
    ) -> PolicyEvaluationResult:
        steps = []
        now = datetime.now(timezone.utc)
        
        # Ensure purchase_date is timezone aware for comparison if needed
        if purchase_date.tzinfo is None:
            purchase_date = purchase_date.replace(tzinfo=timezone.utc)
            
        days_since_purchase = (now - purchase_date).days
        steps.append(f"[Security Check] Prompt Injection Flag: {is_injection}")
        if is_injection:
            pats = ", ".join(injection_patterns) if injection_patterns else "Detected"
            steps.append(f"[Policy Rule Match] Intercepted prompt injection pattern: {pats}")
            return PolicyEvaluationResult(
                status="ESCALATED",
                matched_rule="ESCALATED_PROMPT_INJECTION",
                explanation="Security guard intercepted prompt injection or suspicious instruction override in request. Escalated to human supervisor.",
                reasoning_steps=steps,
            )

        steps.append(f"[Customer Risk Check] Risk score: {customer_risk_score}, Past refund requests: {customer_refund_count}")
        if customer_risk_score >= 0.8 or customer_refund_count >= self.HIGH_RISK_REFUND_LIMIT:
            steps.append(f"[Policy Rule Match] Customer exceeds risk threshold (Score >= 0.8 or Requests >= {self.HIGH_RISK_REFUND_LIMIT})")
            return PolicyEvaluationResult(
                status="ESCALATED",
                matched_rule="ESCALATED_SUSPICIOUS_HISTORY",
                explanation="Customer account exhibits high refund request frequency or risk rating. Escalated for supervisor review.",
                reasoning_steps=steps,
            )

        steps.append(f"[Order Age Check] Days since purchase: {days_since_purchase} days (Policy limit: {self.MAX_RETURN_AGE_DAYS} days)")
        if days_since_purchase > self.MAX_RETURN_AGE_DAYS:
            steps.append(f"[Policy Rule Match] Order age ({days_since_purchase} days) exceeds 30-day return policy window.")
            return PolicyEvaluationResult(
                status="DENIED",
                matched_rule="DENIED_AGE_LIMIT",
                explanation=f"Item was purchased {days_since_purchase} days ago, which exceeds our 30-day return policy window.",
                reasoning_steps=steps,
            )

        steps.append(f"[Order Value Check] Order total: ${order_total:.2f}, Item price: ${item_price:.2f} (High-value threshold: ${self.HIGH_VALUE_THRESHOLD:.2f})")
        if order_total > self.HIGH_VALUE_THRESHOLD or item_price > self.HIGH_VALUE_THRESHOLD:
            steps.append(f"[Policy Rule Match] Order/Item value exceeds ${self.HIGH_VALUE_THRESHOLD:.2f} threshold requiring manual approval.")
            return PolicyEvaluationResult(
                status="ESCALATED",
                matched_rule="ESCALATED_HIGH_VALUE",
                explanation=f"Orders or items valued over ${self.HIGH_VALUE_THRESHOLD:.2f} require human supervisor review per company risk policy.",
                reasoning_steps=steps,
            )

        steps.append(f"[Item Condition Check] Is Final Sale item: {is_final_sale}, Reported reason: '{reason_category}'")
        if is_final_sale:
            if reason_category.lower() in ["damaged", "defective", "wrong_item"]:
                steps.append(f"[Policy Rule Match] Final sale item reported as {reason_category}. Escalated for manual inspection.")
                return PolicyEvaluationResult(
                    status="ESCALATED",
                    matched_rule="ESCALATED_FINAL_SALE_DAMAGED",
                    explanation="Final-sale items are generally non-refundable, but damaged/defective claims require manual supervisor inspection.",
                    reasoning_steps=steps,
                )
            else:
                steps.append(f"[Policy Rule Match] Final sale item requested for return under standard reason '{reason_category}'.")
                return PolicyEvaluationResult(
                    status="DENIED",
                    matched_rule="DENIED_FINAL_SALE",
                    explanation="This item was purchased as Final Sale / Clearance and is not eligible for return or refund.",
                    reasoning_steps=steps,
                )

        if reason_category.lower() in ["damaged", "defective", "wrong_item"]:
            steps.append(f"[Policy Rule Match] Eligible claim for {reason_category} item within policy window.")
            return PolicyEvaluationResult(
                status="APPROVED",
                matched_rule="APPROVED_DAMAGED_OR_WRONG",
                explanation=f"Refund approved due to verified issue ({reason_category}) within the eligible policy window.",
                reasoning_steps=steps,
            )

        steps.append(f"[Policy Rule Match] Standard return within 30 days ({days_since_purchase} days old) under valid reason '{reason_category}'.")
        return PolicyEvaluationResult(
            status="APPROVED",
            matched_rule="APPROVED_STANDARD",
            explanation="Refund approved for standard return within the 30-day window.",
            reasoning_steps=steps,
        )


policy_engine = RefundPolicyEngine()
