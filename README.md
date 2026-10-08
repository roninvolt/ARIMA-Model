# ForecastAI 📈
> **Intelligent Time-Series Forecasting with ARIMA**

ForecastAI is a modern, full-stack quantitative time-series forecasting platform. It empowers data scientists, financial analysts, and business operators to upload historical CSV datasets, test stationarity, automatically select optimal ARIMA parameters using AIC/BIC, train and evaluate models on holdout sets, visualize forecasts with statistical confidence bands, and download publication-quality PDF reports and CSV projections.

---

## ✨ Key Features

- **📊 Exploratory Time-Series Analysis:** Automatic timestamp parsing, chronological sorting, frequency detection, missing value imputation, and descriptive statistics.
- **🔬 Augmented Dickey-Fuller (ADF) Stationarity Test:** Statistical unit-root testing with critical values, stationarity verdict, and interactive 1st/2nd order differencing simulations.
- **🧠 Automated ARIMA Parameter Selection:** Grid exploration evaluating candidate $(p, d, q)$ models ranked by Akaike Information Criterion (AIC) and Bayesian Information Criterion (BIC).
- **🎯 Holdout Train/Test Validation:** Chronological data splitting with precision performance metrics:
  - **MAE** (Mean Absolute Error)
  - **RMSE** (Root Mean Squared Error)
  - **MAPE** (Mean Absolute Percentage Error)
- **📈 Interactive Future Projections:** Multi-horizon forecasting ($7, 14, 30, 60, 90,$ or custom periods) with shaded $95\%$ statistical confidence bounds.
- **🔍 Model Diagnostics & Residual Checks:** Residual timeseries plot, histogram distribution, Autocorrelation Function (ACF) plot, and the Ljung-Box test for white noise validation.
- **📥 Dual Export Pipeline:** Instant downloadable forecast schedules (CSV) and executive-ready vector PDF reports with embedded high-resolution Matplotlib charts and summary tables.
- **⚡ Instant Demo Datasets:** One-click bundled samples for Daily Retail Sales, Cloud Web Traffic, and Monthly Regional Power Grid Demand.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS (Modern dark mode, glassmorphism, responsive grid)
- **Visualizations:** Recharts (Interactive SVG curves, shaded areas, tooltips)
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python 3.11 - 3.14)
- **Server:** Uvicorn
- **Statistical Engine:** Statsmodels (`statsmodels.tsa.arima.model.ARIMA`, `adfuller`, `acorr_ljungbox`)
- **Data Manipulation:** Pandas & NumPy
- **Database:** SQLite with SQLAlchemy ORM
- **Report Engine:** ReportLab + Matplotlib

---

## 🚀 Getting Started Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Start the Backend API

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will be live at `http://127.0.0.1:8000`. You can inspect the interactive OpenAPI documentation at `http://127.0.0.1:8000/docs`.

### 2. Start the Frontend Application

```bash
cd frontend
npm install
npm run dev
```

The application will be running at `http://localhost:5173/` with automatic API proxying to port 8000.

---

## 🐳 Docker Deployment

To launch the full production stack using Docker Compose:

```bash
docker-compose up --build
```

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`

---

## 📂 Project Structure

```text
ARIMAA/
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, Footer, HeroVisualization, StepProgress, etc.
│   │   ├── pages/              # Home, Forecast, Analysis, About, Documentation
│   │   ├── services/           # Typed API communication client
│   │   ├── types/              # TypeScript schema interfaces
│   │   ├── App.tsx             # Main router and state coordinator
│   │   ├── main.tsx
│   │   └── index.css           # Design tokens, typography, glassmorphism
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── backend/
│   ├── app/
│   │   ├── api/routes.py       # FastAPI upload, train, forecast, export endpoints
│   │   ├── services/           # ARIMA, data processor, ReportLab PDF generator
│   │   ├── models/database.py  # SQLAlchemy SQLite schema
│   │   ├── schemas/            # Pydantic validation models
│   │   └── main.py             # FastAPI entrypoint
│   ├── requirements.txt
│   └── Dockerfile
│
├── data/
│   ├── sample_dataset.csv      # Daily retail sales (600 rows)
│   ├── website_visitors.csv    # Daily website traffic (365 rows)
│   └── energy_demand.csv       # Monthly power demand (72 rows)
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 📄 License & Attribution

ForecastAI is designed for modern quantitative modeling and time-series education. Built with statistical rigor using Statsmodels.
