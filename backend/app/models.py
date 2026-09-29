from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    risk_score = Column(Float, default=0.0)  # 0.0 (safe) to 1.0 (high risk)
    total_refunds_requested = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)

    orders = relationship("Order", back_populates="customer")
    refund_requests = relationship("RefundRequest", back_populates="customer")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    order_number = Column(String, unique=True, nullable=False, index=True)
    purchase_date = Column(DateTime, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="DELIVERED")  # DELIVERED, SHIPPED, PENDING
    shipping_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    refund_requests = relationship("RefundRequest", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_name = Column(String, nullable=False)
    sku = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1)
    is_final_sale = Column(Boolean, default=False)
    condition = Column(String, default="NEW")  # NEW, CLEARANCE, FINAL_SALE

    order = relationship("Order", back_populates="items")
    refund_requests = relationship("RefundRequest", back_populates="item")


class RefundRequest(Base):
    __tablename__ = "refund_requests"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("order_items.id"), nullable=False)

    reason_category = Column(String, nullable=False)  # damaged, defective, wrong_item, size_fit, changed_mind, fraudulent
    customer_message = Column(Text, nullable=False)
    
    # Decision details
    status = Column(String, nullable=False)  # APPROVED, DENIED, ESCALATED, MANUAL_APPROVED, MANUAL_DENIED
    injection_detected = Column(Boolean, default=False)
    injection_patterns = Column(Text, nullable=True)  # JSON or comma-separated
    policy_matched_rule = Column(String, nullable=False)
    policy_explanation = Column(Text, nullable=False)
    
    # Service Metadata
    ai_sentiment = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_suggested_reply = Column(Text, nullable=True)
    
    # Reasoning Audit Trail
    reasoning_logs = Column(Text, nullable=False)  # JSON string array of steps
    admin_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    customer = relationship("Customer", back_populates="refund_requests")
    order = relationship("Order", back_populates="refund_requests")
    item = relationship("OrderItem", back_populates="refund_requests")
