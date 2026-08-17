class AlipayClient:
    def create_order(self, user_id: str, amount: int, subject: str) -> dict[str, object]:
        return {
            "provider": "alipay",
            "user_id": user_id,
            "amount": amount,
            "subject": subject,
            "status": "pending",
        }

    def verify_callback(self, payload: dict[str, object]) -> bool:
        return bool(payload)
