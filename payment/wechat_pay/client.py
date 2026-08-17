class WeChatPayClient:
    def create_order(self, user_id: str, amount: int, description: str) -> dict[str, object]:
        return {
            "provider": "wechat_pay",
            "user_id": user_id,
            "amount": amount,
            "description": description,
            "status": "pending",
        }

    def verify_callback(self, payload: dict[str, object]) -> bool:
        return bool(payload)
