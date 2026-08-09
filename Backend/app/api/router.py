from fastapi import APIRouter

from app.api.endpoints import auth, medicines, orders, prescriptions

api_router = APIRouter()


@api_router.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "MediMall API"}


api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(medicines.router, prefix="/medicines", tags=["medicines"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["prescriptions"])

