import type {
  UploadResponse,
  SampleDatasetInfo,
  AnalyzeResponse,
  StationarityResponse,
  AutoArimaResponse,
  TrainModelResponse,
  ForecastResponse,
  DiagnosticsResponse,
} from '../types/api';

export const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('FORECASTAI_API_URL');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  const envUrl = (import.meta.env.VITE_API_URL as string)?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return '/api';
};

export const setCustomApiUrl = (url: string | null) => {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('FORECASTAI_API_URL', url.trim());
    } else {
      localStorage.removeItem('FORECASTAI_API_URL');
    }
  }
};

export const getCustomApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('FORECASTAI_API_URL') || '';
  }
  return '';
};

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } else {
        const text = await res.text();
        const isHtml = text.includes('<!doctype') || text.includes('<html');
        if (text && text.length < 250 && !isHtml) {
          errorMsg = text;
        } else if (res.status === 405) {
          errorMsg = `Server error (405): Method Not Allowed. The request was routed to static frontend assets instead of the backend API. Please redeploy with the updated vercel.json or configure your backend URL in settings.`;
        } else if (res.status === 404) {
          errorMsg = `API endpoint not found (404). Ensure your backend server is deployed and running, or configure VITE_API_URL.`;
        } else if (res.status === 502 || res.status === 503 || res.status === 504) {
          errorMsg = `Backend server is temporarily unavailable (${res.status}). The service may still be waking up.`;
        }
      }
    } catch {
      // ignore parse error
    }
    throw new ApiError(errorMsg, res.status);
  }
  return res.json() as Promise<T>;
}

export const FALLBACK_CATALOG: SampleDatasetInfo[] = [
  {
    id: "sales",
    title: "Daily E-Commerce Sales",
    description: "600 daily transactions showing growth trends, weekly cycles, and seasonal swings.",
    filename: "sample_dataset.csv",
    date_col: "date",
    target_col: "sales"
  },
  {
    id: "traffic",
    title: "Website Visitors",
    description: "365 days of website traffic with steady growth and weekend engagement fluctuations.",
    filename: "website_visitors.csv",
    date_col: "timestamp",
    target_col: "visitors"
  },
  {
    id: "energy",
    title: "Monthly Energy Demand",
    description: "72 months of regional power demand with prominent winter/summer peak loads.",
    filename: "energy_demand.csv",
    date_col: "month",
    target_col: "megawatt_hours"
  }
];

export const api = {
  async uploadCsv(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${getApiBase()}/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<UploadResponse>(res);
  },

  async loadDemoDataset(): Promise<UploadResponse> {
    const res = await fetch(`${getApiBase()}/demo-dataset`, {
      method: 'POST',
    });
    return handleResponse<UploadResponse>(res);
  },

  async fetchSampleDatasets(): Promise<SampleDatasetInfo[]> {
    try {
      const res = await fetch(`${getApiBase()}/sample-datasets`);
      return await handleResponse<SampleDatasetInfo[]>(res);
    } catch {
      return FALLBACK_CATALOG;
    }
  },

  async loadSampleDataset(key: string): Promise<UploadResponse> {
    const res = await fetch(`${getApiBase()}/sample-datasets/load/${key}`, {
      method: 'POST',
    });
    return handleResponse<UploadResponse>(res);
  },

  async analyzeSeries(params: {
    dataset_id: string;
    date_column: string;
    target_column: string;
    fill_missing?: string;
  }): Promise<AnalyzeResponse> {
    const res = await fetch(`${getApiBase()}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse<AnalyzeResponse>(res);
  },

  async testStationarity(params: {
    dataset_id: string;
    date_column: string;
    target_column: string;
    differencing?: number;
  }): Promise<StationarityResponse> {
    const res = await fetch(`${getApiBase()}/stationarity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse<StationarityResponse>(res);
  },

  async selectAutoArima(params: {
    dataset_id: string;
    date_column: string;
    target_column: string;
    max_p?: number;
    max_d?: number;
    max_q?: number;
  }): Promise<AutoArimaResponse> {
    const res = await fetch(`${getApiBase()}/arima/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse<AutoArimaResponse>(res);
  },

  async trainModel(params: {
    dataset_id: string;
    date_column: string;
    target_column: string;
    p: number;
    d: number;
    q: number;
    test_size_ratio?: number;
  }): Promise<TrainModelResponse> {
    const res = await fetch(`${getApiBase()}/arima/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse<TrainModelResponse>(res);
  },

  async generateForecast(params: {
    dataset_id: string;
    date_column: string;
    target_column: string;
    p: number;
    d: number;
    q: number;
    horizon: number;
    confidence_level?: number;
  }): Promise<ForecastResponse> {
    const res = await fetch(`${getApiBase()}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse<ForecastResponse>(res);
  },

  async getDiagnostics(params: {
    dataset_id: string;
    date_column: string;
    target_column: string;
    p: number;
    d: number;
    q: number;
  }): Promise<DiagnosticsResponse> {
    const res = await fetch(`${getApiBase()}/diagnostics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse<DiagnosticsResponse>(res);
  },

  getCsvExportUrl(runId: string): string {
    return `${getApiBase()}/export/${runId}/csv`;
  },

  getPdfExportUrl(runId: string): string {
    return `${getApiBase()}/export/${runId}/pdf`;
  },
};
