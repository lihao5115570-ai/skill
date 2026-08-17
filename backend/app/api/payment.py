from fastapi import APIRouter

router = APIRouter(prefix="/payment", tags=["payment"])


@router.post("/create-order")
def create_payment_order() -> dict[str, object]:
    return {
        "order_id": "demo-order",
        "status": "pending",
        "amount": 9900,
        "currency": "CNY",
    }
