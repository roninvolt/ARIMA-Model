from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.database import init_db
from app.api.routes import router

try:
    init_db()
except Exception:
    pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables on startup
    try:
        init_db()
    except Exception:
        pass
    yield

app = FastAPI(
    title="ForecastAI — ARIMA Time-Series Intelligence Engine",
    description="Statistical time-series forecasting, automated ARIMA parameter selection, validation, and analytics.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints (mounted under /api and root fallback for reverse proxies/serverless)
app.include_router(router, prefix="/api")
app.include_router(router)

@app.get("/")
def root():
    return {
        "name": "ForecastAI API",
        "description": "Intelligent Time-Series Forecasting with ARIMA",
        "docs": "/docs",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
