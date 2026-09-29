from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import Customer, Order, OrderItem, RefundRequest
from app.database import engine, Base


def seed_database(db: Session):
    # Recreate tables to start clean
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    now = datetime.now(timezone.utc)

    customers_data = [
        {"name": "Alice Smith", "email": "alice@example.com", "risk_score": 0.05, "total_refunds_requested": 0},
        {"name": "Bob Jones", "email": "bob@example.com", "risk_score": 0.1, "total_refunds_requested": 1},
        {"name": "Charlie Brown", "email": "charlie@example.com", "risk_score": 0.15, "total_refunds_requested": 0},
        {"name": "Diana Prince", "email": "diana@example.com", "risk_score": 0.0, "total_refunds_requested": 0},
        {"name": "Evan Wright", "email": "evan@example.com", "risk_score": 0.05, "total_refunds_requested": 1},
        {"name": "Fiona Gallagher", "email": "fiona@example.com", "risk_score": 0.6, "total_refunds_requested": 2},
        {"name": "George Clark", "email": "george@example.com", "risk_score": 0.05, "total_refunds_requested": 0},
        {"name": "Hannah Abbott", "email": "hannah@example.com", "risk_score": 0.85, "total_refunds_requested": 5},
        {"name": "Ian Malcolm", "email": "ian@example.com", "risk_score": 0.1, "total_refunds_requested": 0},
        {"name": "Julia Roberts", "email": "julia@example.com", "risk_score": 0.2, "total_refunds_requested": 1},
        {"name": "Kevin Flynn", "email": "kevin@example.com", "risk_score": 0.0, "total_refunds_requested": 0},
        {"name": "Laura Croft", "email": "laura@example.com", "risk_score": 0.1, "total_refunds_requested": 0},
        {"name": "Michael Scott", "email": "michael@example.com", "risk_score": 0.25, "total_refunds_requested": 2},
        {"name": "Nina Myers", "email": "nina@example.com", "risk_score": 0.9, "total_refunds_requested": 4},
        {"name": "Oscar Martinez", "email": "oscar@example.com", "risk_score": 0.05, "total_refunds_requested": 1},
    ]

    orders_data = [
        # 1. Alice (5 days ago, $45)
        {"cust_idx": 0, "ord_num": "ORD-1001", "days": 5, "total": 45.0, "prod": "Vintage Cotton T-Shirt", "sku": "TSH-001", "price": 45.0, "final_sale": False},
        # 2. Bob (45 days ago, $120)
        {"cust_idx": 1, "ord_num": "ORD-1002", "days": 45, "total": 120.0, "prod": "Leather Trail Running Shoes", "sku": "SHO-002", "price": 120.0, "final_sale": False},
        # 3. Charlie (10 days ago, $80 final sale)
        {"cust_idx": 2, "ord_num": "ORD-1003", "days": 10, "total": 80.0, "prod": "Winter Clearance Jacket", "sku": "JAC-003", "price": 80.0, "final_sale": True},
        # 4. Diana (12 days ago, $1,250 high value)
        {"cust_idx": 3, "ord_num": "ORD-1004", "days": 12, "total": 1250.0, "prod": "Luxury Leather Handbag", "sku": "BAG-004", "price": 1250.0, "final_sale": False},
        # 5. Evan (8 days ago, $299 damaged)
        {"cust_idx": 4, "ord_num": "ORD-1005", "days": 8, "total": 299.0, "prod": "UltraWide 27\" Gaming Monitor", "sku": "MON-005", "price": 299.0, "final_sale": False},
        # 6. Fiona (4 days ago, $65 prompt injection demo)
        {"cust_idx": 5, "ord_num": "ORD-1006", "days": 4, "total": 65.0, "prod": "Wireless Bluetooth Headphones", "sku": "AUD-006", "price": 65.0, "final_sale": False},
        # 7. George (14 days ago, $85 size fit)
        {"cust_idx": 6, "ord_num": "ORD-1007", "days": 14, "total": 85.0, "prod": "Slim Fit Denim Jeans", "sku": "JNS-007", "price": 85.0, "final_sale": False},
        # 8. Hannah (6 days ago, $95 suspicious history)
        {"cust_idx": 7, "ord_num": "ORD-1008", "days": 6, "total": 95.0, "prod": "Ceramic Kitchen Cookware Set", "sku": "KIT-008", "price": 95.0, "final_sale": False},
        # 9. Ian (3 days ago, $35 wrong item)
        {"cust_idx": 8, "ord_num": "ORD-1009", "days": 3, "total": 35.0, "prod": "Hardcover Sci-Fi Novel", "sku": "BOK-009", "price": 35.0, "final_sale": False},
        # 10. Julia (7 days ago, $150 final sale damaged)
        {"cust_idx": 9, "ord_num": "ORD-1010", "days": 7, "total": 150.0, "prod": "Final Sale Silk Evening Dress", "sku": "DRS-010", "price": 150.0, "final_sale": True},
        # 11. Kevin (15 days ago, $899 high value)
        {"cust_idx": 10, "ord_num": "ORD-1011", "days": 15, "total": 899.0, "prod": "Mechanical Keyboard & Chair Set", "sku": "OFF-011", "price": 899.0, "final_sale": False},
        # 12. Laura (60 days ago, $110 expired)
        {"cust_idx": 11, "ord_num": "ORD-1012", "days": 60, "total": 110.0, "prod": "Waterproof Hiking Boots", "sku": "BOT-012", "price": 110.0, "final_sale": False},
        # 13. Michael (20 days ago, $40 changed mind)
        {"cust_idx": 12, "ord_num": "ORD-1013", "days": 20, "total": 40.0, "prod": "Ergonomic Desk Lamp", "sku": "LMP-013", "price": 40.0, "final_sale": False},
        # 14. Nina (9 days ago, $75 prompt injection attack)
        {"cust_idx": 13, "ord_num": "ORD-1014", "days": 9, "total": 75.0, "prod": "Smart Fitness Watch Band", "sku": "WTC-014", "price": 75.0, "final_sale": False},
        # 15. Oscar (11 days ago, $149 defective)
        {"cust_idx": 14, "ord_num": "ORD-1015", "days": 11, "total": 149.0, "prod": "Noise Canceling Earbuds", "sku": "AUD-015", "price": 149.0, "final_sale": False},
    ]

    created_customers = []
    for c in customers_data:
        cust = Customer(
            name=c["name"],
            email=c["email"],
            risk_score=c["risk_score"],
            total_refunds_requested=c["total_refunds_requested"],
            created_at=now - timedelta(days=90)
        )
        db.add(cust)
        created_customers.append(cust)

    db.commit()

    for o in orders_data:
        cust = created_customers[o["cust_idx"]]
        p_date = now - timedelta(days=o["days"])
        ord_obj = Order(
            customer_id=cust.id,
            order_number=o["ord_num"],
            purchase_date=p_date,
            total_amount=o["total"],
            status="DELIVERED",
            shipping_address="123 Main Street, Suite 400, San Francisco, CA"
        )
        db.add(ord_obj)
        db.commit()

        item = OrderItem(
            order_id=ord_obj.id,
            product_name=o["prod"],
            sku=o["sku"],
            price=o["price"],
            quantity=1,
            is_final_sale=o["final_sale"],
            condition="FINAL_SALE" if o["final_sale"] else "NEW"
        )
        db.add(item)

    db.commit()
    print("Database successfully seeded with 15 customers and orders.")
