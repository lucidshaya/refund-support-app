from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class OrderItemSchema(BaseModel):
    id: int
    order_id: int
    product_name: str
    sku: str
    price: float
    quantity: int
    is_final_sale: bool
    condition: str

    model_config = ConfigDict(from_attributes=True)


class OrderSchema(BaseModel):
    id: int
    customer_id: int
    order_number: str
    purchase_date: datetime
    total_amount: float
    status: str
    shipping_address: Optional[str] = None
    items: List[OrderItemSchema] = []

    model_config = ConfigDict(from_attributes=True)


class CustomerSchema(BaseModel):
    id: int
    name: str
    email: str
    risk_score: float
    total_refunds_requested: int
    created_at: datetime
    orders: List[OrderSchema] = []

    model_config = ConfigDict(from_attributes=True)


class RefundRequestCreate(BaseModel):
    customer_id: int
    order_id: int
    item_id: int
    reason_category: str  # damaged, defective, wrong_item, size_fit, changed_mind, prompt_injection
    customer_message: str


class AdminReviewRequest(BaseModel):
    action: str  # MANUAL_APPROVED or MANUAL_DENIED
    admin_notes: Optional[str] = None


class RefundRequestSchema(BaseModel):
    id: int
    customer_id: int
    order_id: int
    item_id: int
    reason_category: str
    customer_message: str
    status: str
    injection_detected: bool
    injection_patterns: Optional[str] = None
    policy_matched_rule: str
    policy_explanation: str
    ai_sentiment: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_suggested_reply: Optional[str] = None
    using_fallback: Optional[bool] = False
    reasoning_logs: List[str]
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Relationships data
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    product_name: Optional[str] = None
    order_number: Optional[str] = None
    item_price: Optional[float] = None
    order_total: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class StatsSchema(BaseModel):
    total_requests: int
    approved: int
    denied: int
    escalated: int
    pending_review: int
