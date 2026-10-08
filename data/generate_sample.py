import pandas as pd
import numpy as np

# Set seed for reproducibility
np.random.seed(42)

# Generate 600 days of realistic daily sales data
dates = pd.date_range(start="2024-01-01", periods=600, freq="D")
n = len(dates)

# Trend + 7-day weekly seasonality + slight 30-day monthly wave + noise
time_idx = np.arange(n)
trend = 120 + 0.15 * time_idx
weekly = 25 * np.sin(2 * np.pi * time_idx / 7) + 10 * np.cos(2 * np.pi * time_idx / 7)
monthly = 15 * np.sin(2 * np.pi * time_idx / 30.4)
noise = np.random.normal(0, 8, n)

sales = np.round(trend + weekly + monthly + noise, 2)
# Ensure all values are positive
sales = np.maximum(sales, 20.0)

df = pd.DataFrame({
    "date": dates.strftime("%Y-%m-%d"),
    "sales": sales
})

df.to_csv("c:/Users/Volt/Documents/ARIMAA/data/sample_dataset.csv", index=False)
print(f"Generated sample_dataset.csv with {len(df)} rows.")



