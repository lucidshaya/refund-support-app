from datetime import datetime, timedelta, timezone
from app.policy import policy_engine


def test_policy_injection_escalation():
    now = datetime.now(timezone.utc)
    res = policy_engine.evaluate(
        customer_risk_score=0.1,
        customer_refund_count=0,
        purchase_date=now - timedelta(days=5),
        order_total=50.0,
        item_price=50.0,
        is_final_sale=False,
        reason_category="size_fit",
        is_injection=True,
        injection_patterns=["INSTRUCTION_OVERRIDE"],
    )
    assert res.status == "ESCALATED"
    assert res.matched_rule == "ESCALATED_PROMPT_INJECTION"


def test_policy_expired_order_denied():
    now = datetime.now(timezone.utc)
    res = policy_engine.evaluate(
        customer_risk_score=0.1,
        customer_refund_count=0,
        purchase_date=now - timedelta(days=45),  # > 30 days
        order_total=80.0,
        item_price=80.0,
        is_final_sale=False,
        reason_category="changed_mind",
        is_injection=False,
    )
    assert res.status == "DENIED"
    assert res.matched_rule == "DENIED_AGE_LIMIT"


def test_policy_final_sale_denied():
    now = datetime.now(timezone.utc)
    res = policy_engine.evaluate(
        customer_risk_score=0.1,
        customer_refund_count=0,
        purchase_date=now - timedelta(days=10),
        order_total=60.0,
        item_price=60.0,
        is_final_sale=True,
        reason_category="size_fit",
        is_injection=False,
    )
    assert res.status == "DENIED"
    assert res.matched_rule == "DENIED_FINAL_SALE"


def test_policy_final_sale_damaged_escalated():
    now = datetime.now(timezone.utc)
    res = policy_engine.evaluate(
        customer_risk_score=0.1,
        customer_refund_count=0,
        purchase_date=now - timedelta(days=10),
        order_total=60.0,
        item_price=60.0,
        is_final_sale=True,
        reason_category="damaged",
        is_injection=False,
    )
    assert res.status == "ESCALATED"
    assert res.matched_rule == "ESCALATED_FINAL_SALE_DAMAGED"


def test_policy_high_value_order_escalated():
    now = datetime.now(timezone.utc)
    res = policy_engine.evaluate(
        customer_risk_score=0.1,
        customer_refund_count=0,
        purchase_date=now - timedelta(days=10),
        order_total=650.0,  # > 500
        item_price=200.0,
        is_final_sale=False,
        reason_category="changed_mind",
        is_injection=False,
    )
    assert res.status == "ESCALATED"
    assert res.matched_rule == "ESCALATED_HIGH_VALUE"


def test_policy_high_value_item_escalated():
    now = datetime.now(timezone.utc)
    res = policy_engine.evaluate(
        customer_risk_score=0.1,
        customer_refund_count=0,
        purchase_date=now - timedelta(days=10),
        order_total=600.0,
        item_price=550.0,  # > 500
        is_final_sale=False,
        reason_category="defective",
        is_injection=False,
    )
    assert res.status == "ESCALATED"
    assert res.matched_rule == "ESCALATED_HIGH_VALUE"


def test_policy_suspicious_customer_risk_escalated():
    now = datetime.now(timezone.utc)
    res = policy_engine.evaluate(
        customer_risk_score=0.85,  # >= 0.8
        customer_refund_count=1,
        purchase_date=now - timedelta(days=5),
        order_total=40.0,
        item_price=40.0,
        is_final_sale=False,
        reason_category="size_fit",
        is_injection=False,
    )
    assert res.status == "ESCALATED"
    assert res.matched_rule == "ESCALATED_SUSPICIOUS_HISTORY"


def test_policy_excessive_refund_count_escalated():
    now = datetime.now(timezone.utc)
    res = policy_engine.evaluate(
        customer_risk_score=0.2,
        customer_refund_count=5,  # >= 4
        purchase_date=now - timedelta(days=5),
        order_total=40.0,
        item_price=40.0,
        is_final_sale=False,
        reason_category="size_fit",
        is_injection=False,
    )
    assert res.status == "ESCALATED"
    assert res.matched_rule == "ESCALATED_SUSPICIOUS_HISTORY"


def test_policy_damaged_item_approved():
    now = datetime.now(timezone.utc)
    res = policy_engine.evaluate(
        customer_risk_score=0.1,
        customer_refund_count=0,
        purchase_date=now - timedelta(days=8),
        order_total=150.0,
        item_price=150.0,
        is_final_sale=False,
        reason_category="damaged",
        is_injection=False,
    )
    assert res.status == "APPROVED"
    assert res.matched_rule == "APPROVED_DAMAGED_OR_WRONG"


def test_policy_standard_return_approved():
    now = datetime.now(timezone.utc)
    res = policy_engine.evaluate(
        customer_risk_score=0.1,
        customer_refund_count=0,
        purchase_date=now - timedelta(days=12),
        order_total=75.0,
        item_price=75.0,
        is_final_sale=False,
        reason_category="size_fit",
        is_injection=False,
    )
    assert res.status == "APPROVED"
    assert res.matched_rule == "APPROVED_STANDARD"
