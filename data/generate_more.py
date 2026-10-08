import pandas as pd
import numpy as np

np.random.seed(101)
dates = pd.date_range(start="2024-01-01", periods=365, freq="D")
n = len(dates)
trend = 5000 + 15 * np.arange(n)
weekend_dip = np.where(dates.dayofweek >= 5, -800, 400)
noise = np.random.normal(0, 200, n)
traffic = np.round(trend + weekend_dip + noise, 0)

df_traffic = pd.DataFrame({
    "timestamp": dates.strftime("%Y-%m-%d"),
    "visitors": traffic.astype(int)
})
df_traffic.to_csv("c:/Users/Volt/Documents/ARIMAA/data/website_visitors.csv", index=False)

# Monthly Energy dataset
dates_m = pd.date_range(start="2018-01-01", periods=72, freq="MS")
n_m = len(dates_m)
trend_m = 300 + 1.2 * np.arange(n_m)
seasonal_m = 60 * np.sin(2 * np.pi * np.arange(n_m) / 12) # summer/winter peaks
noise_m = np.random.normal(0, 15, n_m)
energy = np.round(trend_m + seasonal_m + noise_m, 1)

df_energy = pd.DataFrame({
    "month": dates_m.strftime("%Y-%m"),
    "megawatt_hours": energy
})
df_energy.to_csv("c:/Users/Volt/Documents/ARIMAA/data/energy_demand.csv", index=False)
print("Generated extra datasets.")
