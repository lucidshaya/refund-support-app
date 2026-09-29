import json
from typing import List
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload

from app.database import engine, Base, get_db, SessionLocal
from app.models import Customer, Order, OrderItem, RefundRequest
from app.schemas import (
    CustomerSchema,
    OrderSchema,
    RefundRequestCreate,
    RefundRequestSchema,
    AdminReviewRequest,
    StatsSchema,
)
from app.guard import guard
from app.policy import policy_engine
from app.ai import ai_service
from app.seed_data import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    # Check if database is empty, if so seed it
    db = SessionLocal()
    try:
        if db.query(Customer).count() == 0:
            seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="E-Commerce AI Refund Support API",
    description="Automated AI-assisted refund engine with deterministic policy authority and prompt injection defenses.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "service": "Refund Support Engine API",
        "status": "online",
        "policy_authority": "deterministic_python_engine",
        "guard_active": True,
    }


@app.post("/api/seed")
def trigger_seed(db: Session = Depends(get_db)):
    """Resets and re-seeds the database with 15 test customers and orders."""
    seed_database(db)
    return {"message": "Database successfully re-seeded with 15 customers and order history."}


@app.get("/api/customers", response_model=List[CustomerSchema])
def list_customers(db: Session = Depends(get_db)):
    """Returns all customers with order details."""
    customers = db.query(Customer).options(joinedload(Customer.orders).joinedload(Order.items)).all()
    return customers


@app.get("/api/orders", response_model=List[OrderSchema])
def list_orders(db: Session = Depends(get_db)):
    """Returns all orders with items."""
    orders = db.query(Order).options(joinedload(Order.items)).all()
    return orders


@app.get("/api/stats", response_model=StatsSchema)
def get_stats(db: Session = Depends(get_db)):
    """Returns live stats for admin dashboard."""
    total = db.query(RefundRequest).count()
    approved = db.query(RefundRequest).filter(RefundRequest.status.in_(["APPROVED", "MANUAL_APPROVED"])).count()
    denied = db.query(RefundRequest).filter(RefundRequest.status.in_(["DENIED", "MANUAL_DENIED"])).count()
    escalated = db.query(RefundRequest).filter(RefundRequest.status == "ESCALATED").count()
    
    return StatsSchema(
        total_requests=total,
        approved=approved,
        denied=denied,
        escalated=escalated,
        pending_review=escalated,
    )


@app.post("/api/refunds/submit", response_model=RefundRequestSchema)
def submit_refund_request(payload: RefundRequestCreate, db: Session = Depends(get_db)):
    """
    Submits a new customer refund request.
    Workflow:
    1. Guard analyze prompt injection
    2. Retrieve customer, order, and item records
    3. Evaluate deterministic policy engine (Sole authority on Approved/Denied/Escalated)
    4. Call AI service for sentiment classification and customer-facing reply draft
    5. Save full audit trail to database and return result
    """
    # 1. Prompt Injection Security Guard
    is_injection, patterns, risk = guard.analyze(payload.customer_message)
    pattern_str = ", ".join(patterns) if patterns else None

    # 2. Look up customer, order, item
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    order = db.query(Order).filter(Order.id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    item = db.query(OrderItem).filter(OrderItem.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Order item not found")

    # 3. Evaluate Deterministic Policy Engine
    policy_result = policy_engine.evaluate(
        customer_risk_score=customer.risk_score,
        customer_refund_count=customer.total_refunds_requested,
        purchase_date=order.purchase_date,
        order_total=order.total_amount,
        item_price=item.price,
        is_final_sale=item.is_final_sale,
        reason_category=payload.reason_category,
        is_injection=is_injection,
        injection_patterns=patterns,
    )

    # Update customer stats
    customer.total_refunds_requested += 1
    if is_injection:
        customer.risk_score = min(1.0, customer.risk_score + 0.3)

    # 4. Service Classification & Reply Drafting
    ai_output = ai_service.process_refund_request(
        customer_name=customer.name,
        product_name=item.product_name,
        customer_message=payload.customer_message,
        reason_category=payload.reason_category,
        policy_decision=policy_result.status,
        policy_explanation=policy_result.explanation,
        is_injection=is_injection,
    )

    # 5. Persist Refund Request and Reasoning Audit Log
    refund_req = RefundRequest(
        customer_id=customer.id,
        order_id=order.id,
        item_id=item.id,
        reason_category=payload.reason_category,
        customer_message=payload.customer_message,
        status=policy_result.status,
        injection_detected=is_injection,
        injection_patterns=pattern_str,
        policy_matched_rule=policy_result.matched_rule,
        policy_explanation=policy_result.explanation,
        ai_sentiment=ai_output.get("sentiment"),
        ai_summary=ai_output.get("summary"),
        ai_suggested_reply=ai_output.get("suggested_reply"),
        reasoning_logs=json.dumps(policy_result.reasoning_steps),
    )

    db.add(refund_req)
    db.commit()
    db.refresh(refund_req)

    # Build response schema object
    return _build_refund_response(refund_req, customer, order, item)


@app.get("/api/refunds", response_model=List[RefundRequestSchema])
def list_refund_requests(status_filter: str = None, db: Session = Depends(get_db)):
    """Lists refund requests with optional status filter for Admin Dashboard."""
    query = db.query(RefundRequest).options(
        joinedload(RefundRequest.customer),
        joinedload(RefundRequest.order),
        joinedload(RefundRequest.item),
    )
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(RefundRequest.status == status_filter.upper())

    results = query.order_by(RefundRequest.id.desc()).all()
    return [
        _build_refund_response(r, r.customer, r.order, r.item)
        for r in results
    ]


@app.get("/api/refunds/{request_id}", response_model=RefundRequestSchema)
def get_refund_request(request_id: int, db: Session = Depends(get_db)):
    """Retrieves full details and audit logs for a single refund request."""
    req = db.query(RefundRequest).options(
        joinedload(RefundRequest.customer),
        joinedload(RefundRequest.order),
        joinedload(RefundRequest.item),
    ).filter(RefundRequest.id == request_id).first()

    if not req:
        raise HTTPException(status_code=404, detail="Refund request not found")

    return _build_refund_response(req, req.customer, req.order, req.item)


@app.post("/api/refunds/{request_id}/review", response_model=RefundRequestSchema)
def review_escalated_request(
    request_id: int, review: AdminReviewRequest, db: Session = Depends(get_db)
):
    """Allows admin supervisor to manually approve or deny an ESCALATED request."""
    req = db.query(RefundRequest).options(
        joinedload(RefundRequest.customer),
        joinedload(RefundRequest.order),
        joinedload(RefundRequest.item),
    ).filter(RefundRequest.id == request_id).first()

    if not req:
        raise HTTPException(status_code=404, detail="Refund request not found")

    if review.action not in ["MANUAL_APPROVED", "MANUAL_DENIED"]:
        raise HTTPException(status_code=400, detail="Action must be MANUAL_APPROVED or MANUAL_DENIED")

    req.status = review.action
    req.admin_notes = review.admin_notes
    
    # Update reasoning logs with admin action
    logs = json.loads(req.reasoning_logs) if req.reasoning_logs else []
    logs.append(f"[Admin Override] Human supervisor set status to '{review.action}'. Notes: {review.admin_notes or 'None'}")
    req.reasoning_logs = json.dumps(logs)

    db.commit()
    db.refresh(req)

    return _build_refund_response(req, req.customer, req.order, req.item)


def _build_refund_response(req: RefundRequest, customer: Customer, order: Order, item: OrderItem) -> RefundRequestSchema:
    logs = json.loads(req.reasoning_logs) if isinstance(req.reasoning_logs, str) else req.reasoning_logs
    return RefundRequestSchema(
        id=req.id,
        customer_id=req.customer_id,
        order_id=req.order_id,
        item_id=req.item_id,
        reason_category=req.reason_category,
        customer_message=req.customer_message,
        status=req.status,
        injection_detected=req.injection_detected,
        injection_patterns=req.injection_patterns,
        policy_matched_rule=req.policy_matched_rule,
        policy_explanation=req.policy_explanation,
        ai_sentiment=req.ai_sentiment,
        ai_summary=req.ai_summary,
        ai_suggested_reply=req.ai_suggested_reply,
        reasoning_logs=logs if isinstance(logs, list) else [],
        admin_notes=req.admin_notes,
        created_at=req.created_at,
        updated_at=req.updated_at,
        customer_name=customer.name if customer else "Unknown",
        customer_email=customer.email if customer else "Unknown",
        product_name=item.product_name if item else "Unknown",
        order_number=order.order_number if order else "Unknown",
        item_price=item.price if item else 0.0,
        order_total=order.total_amount if order else 0.0,
    )
