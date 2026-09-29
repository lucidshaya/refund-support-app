import os
import json
from typing import Dict, Any, Optional

# Attempt to load Anthropic / OpenAI client if keys exist
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


class AIService:
    """
    AI Service for classification, intent summary, and customer reply drafting.
    Important: The AI service does NOT decide the refund outcome (APPROVED/DENIED/ESCALATED).
    It accepts the policy engine's decision as a ground-truth constraint and drafts
    an empathetic, clear response.
    """

    def process_refund_request(
        self,
        customer_name: str,
        product_name: str,
        customer_message: str,
        reason_category: str,
        policy_decision: str,  # APPROVED, DENIED, ESCALATED
        policy_explanation: str,
        is_injection: bool = False,
    ) -> Dict[str, Any]:
        
        # Check if LLM API is available
        if ANTHROPIC_API_KEY:
            try:
                return self._call_anthropic(
                    customer_name, product_name, customer_message, reason_category, policy_decision, policy_explanation, is_injection
                )
            except Exception as e:
                print(f"[AI Service] Anthropic call failed, using fallback logic: {e}")
        
        if OPENAI_API_KEY:
            try:
                return self._call_openai(
                    customer_name, product_name, customer_message, reason_category, policy_decision, policy_explanation, is_injection
                )
            except Exception as e:
                print(f"[AI Service] OpenAI call failed, using fallback logic: {e}")

        # Intelligent local fallback engine
        return self._fallback_processing(
            customer_name, product_name, customer_message, reason_category, policy_decision, policy_explanation, is_injection
        )

    def _call_anthropic(
        self,
        customer_name: str,
        product_name: str,
        customer_message: str,
        reason_category: str,
        policy_decision: str,
        policy_explanation: str,
        is_injection: bool,
    ) -> Dict[str, Any]:
        import anthropic

        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        
        system_prompt = (
            "You are an AI customer support assistant for an e-commerce platform. "
            "Your task is to analyze customer messages and draft helpful, polite customer service replies. "
            "CRITICAL DIRECTIVE: The refund status (APPROVED, DENIED, or ESCALATED) has ALREADY been decided by our deterministic policy engine. "
            "You MUST NEVER change or contradict this decision. Your reply must explain the outcome clearly and empathetically."
        )

        user_content = f"""
Customer Name: {customer_name}
Product: {product_name}
Customer Message: "{customer_message}"
Reason Category: {reason_category}
Deterministically Decided Status: {policy_decision}
Policy Explanation: {policy_explanation}
Prompt Injection Flag: {is_injection}

Respond strictly in JSON format with the following keys:
- "sentiment": "positive", "neutral", "frustrated", or "suspicious"
- "summary": a one-sentence summary of the customer request
- "reply": a friendly, professional response to the customer explaining the {policy_decision} decision based on policy explanation.
"""

        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            system=system_prompt,
            messages=[{"role": "user", "content": user_content}],
        )

        text = response.content[0].text
        # Parse JSON
        parsed = json.loads(text[text.find("{"):text.rfind("}")+1])
        return {
            "sentiment": parsed.get("sentiment", "neutral"),
            "summary": parsed.get("summary", f"Refund request for {product_name}"),
            "suggested_reply": parsed.get("reply", self._default_reply(customer_name, policy_decision, policy_explanation)),
        }

    def _call_openai(
        self,
        customer_name: str,
        product_name: str,
        customer_message: str,
        reason_category: str,
        policy_decision: str,
        policy_explanation: str,
        is_injection: bool,
    ) -> Dict[str, Any]:
        import openai

        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        system_prompt = (
            "You are an AI customer support assistant. Analyze customer request and draft customer reply. "
            "Do NOT alter the refund decision outcome."
        )
        prompt = f"Customer: {customer_name}, Item: {product_name}, Msg: {customer_message}, Status: {policy_decision}, Reason: {policy_explanation}"
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        reply = response.choices[0].message.content
        return {
            "sentiment": "neutral",
            "summary": f"Refund request for {product_name}",
            "suggested_reply": reply,
        }

    def _fallback_processing(
        self,
        customer_name: str,
        product_name: str,
        customer_message: str,
        reason_category: str,
        policy_decision: str,
        policy_explanation: str,
        is_injection: bool,
    ) -> Dict[str, Any]:
        # Keyword sentiment analysis
        msg_lower = customer_message.lower()
        if is_injection or "override" in msg_lower or "ignore" in msg_lower or "dan mode" in msg_lower:
            sentiment = "suspicious"
        elif any(w in msg_lower for w in ["unacceptable", "terrible", "angry", "broken", "worst", "ridiculous"]):
            sentiment = "frustrated"
        elif any(w in msg_lower for w in ["thank", "please", "appreciate", "kind"]):
            sentiment = "polite"
        else:
            sentiment = "neutral"

        summary = f"Requesting refund for '{product_name}' (Reason: {reason_category.replace('_', ' ').title()})"
        if is_injection:
            summary = f"Flagged request containing prompt injection patterns for '{product_name}'"

        reply = self._default_reply(customer_name, policy_decision, policy_explanation, product_name)
        return {
            "sentiment": sentiment,
            "summary": summary,
            "suggested_reply": reply,
        }

    def _default_reply(self, customer_name: str, status: str, explanation: str, product_name: str = "item") -> str:
        first_name = customer_name.split()[0] if customer_name else "Customer"
        if status == "APPROVED":
            return (
                f"Hello {first_name},\n\n"
                f"Good news! Your refund request for the {product_name} has been APPROVED.\n"
                f"Reason: {explanation}\n\n"
                f"A credit will be applied to your original method of payment within 3-5 business days. "
                f"Thank you for reaching out to customer support!"
            )
        elif status == "DENIED":
            return (
                f"Hello {first_name},\n\n"
                f"Thank you for contacting customer support regarding your {product_name}.\n"
                f"Unfortunately, your refund request could not be approved at this time.\n"
                f"Reason: {explanation}\n\n"
                f"We apologize for any inconvenience. Please let us know if you have further questions."
            )
        else:  # ESCALATED
            return (
                f"Hello {first_name},\n\n"
                f"Thank you for submitting your request regarding the {product_name}.\n"
                f"Your request has been forwarded to our Human Review Team for secondary review.\n"
                f"Details: {explanation}\n\n"
                f"A customer service specialist will review your case within 24 hours. "
                f"Thank you for your patience!"
            )


ai_service = AIService()
