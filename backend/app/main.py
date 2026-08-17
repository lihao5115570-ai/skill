from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, beauty, blogger, growth, membership, payment, recommend, upload, users
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models import admin as admin_model  # noqa: F401
from app.models import blogger as blogger_model  # noqa: F401


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)
    if engine.dialect.name == "sqlite":
        Base.metadata.create_all(bind=engine)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(users.router, prefix="/api")
    app.include_router(admin.router, prefix="/api")
    app.include_router(upload.router, prefix="/api")
    app.include_router(beauty.router, prefix="/api")
    app.include_router(blogger.router, prefix="/api")
    app.include_router(growth.router, prefix="/api")
    app.include_router(recommend.router, prefix="/api")
    app.include_router(payment.router, prefix="/api")
    app.include_router(membership.router, prefix="/api")
    app.include_router(api_router, prefix=settings.api_prefix)

    return app


app = create_app()
