import os
import tempfile
from datetime import datetime
import json
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# Detect serverless read-only filesystem environment
IS_SERVERLESS = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))

if IS_SERVERLESS:
    db_file = os.path.join(tempfile.gettempdir(), "forecast_ai.db")
    DATABASE_URL = f"sqlite:///{db_file}"
else:
    DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./forecast_ai.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    csv_content = Column(Text, nullable=True)
    row_count = Column(Integer, default=0)
    columns_json = Column(Text, default="[]")
    detected_date_col = Column(String(100), nullable=True)
    detected_target_col = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    runs = relationship("ForecastRunModel", back_populates="dataset", cascade="all, delete-orphan")

    def get_columns(self):
        try:
            return json.loads(self.columns_json)
        except Exception:
            return []

class ForecastRunModel(Base):
    __tablename__ = "forecast_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False)
    date_column = Column(String(100), nullable=False)
    target_column = Column(String(100), nullable=False)
    p = Column(Integer, default=1)
    d = Column(Integer, default=1)
    q = Column(Integer, default=1)
    auto_selected = Column(Boolean, default=False)
    aic = Column(Float, nullable=True)
    bic = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mape = Column(Float, nullable=True)
    horizon = Column(Integer, default=30)
    confidence_level = Column(Float, default=0.95)
    status = Column(String(50), default="COMPLETED")
    results_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("DatasetModel", back_populates="runs")

    def get_results(self):
        try:
            return json.loads(self.results_json) if self.results_json else {}
        except Exception:
            return {}

_db_initialized = False

def init_db():
    global _db_initialized
    try:
        Base.metadata.create_all(bind=engine)
        # Automatic schema migration for existing SQLite databases
        with engine.begin() as conn:
            try:
                result = conn.execute(text("PRAGMA table_info(datasets)")).fetchall()
                col_names = [row[1] for row in result]
                if "csv_content" not in col_names:
                    conn.execute(text("ALTER TABLE datasets ADD COLUMN csv_content TEXT"))
            except Exception:
                pass
        _db_initialized = True
    except Exception as e:
        print(f"init_db notice: {e}")

# Pre-initialize tables on module load
try:
    init_db()
except Exception:
    pass

def get_db():
    global _db_initialized
    if not _db_initialized:
        try:
            init_db()
        except Exception:
            pass
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
