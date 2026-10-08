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

const API_BASE = '/api';

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
      const errorData = await res.json();
      if (errorData.detail) {
        errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore parse error
    }
    throw new ApiError(errorMsg, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async uploadCsv(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<UploadResponse>(res);
  },

  async loadDemoDataset(): Promise<UploadResponse> {
    const res = await fetch(`${API_BASE}/demo-dataset`, {
      method: 'POST',
    });
    return handleResponse<UploadResponse>(res);
  },

  async fetchSampleDatasets(): Promise<SampleDatasetInfo[]> {
    const res = await fetch(`${API_BASE}/sample-datasets`);
    return handleResponse<SampleDatasetInfo[]>(res);
  },

  async loadSampleDataset(key: string): Promise<UploadResponse> {
    const res = await fetch(`${API_BASE}/sample-datasets/load/${key}`, {
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
    const res = await fetch(`${API_BASE}/analyze`, {
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
    const res = await fetch(`${API_BASE}/stationarity`, {
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
    const res = await fetch(`${API_BASE}/arima/select`, {
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
    const res = await fetch(`${API_BASE}/arima/train`, {
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
    const res = await fetch(`${API_BASE}/forecast`, {
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
    const res = await fetch(`${API_BASE}/diagnostics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse<DiagnosticsResponse>(res);
  },

  getCsvExportUrl(runId: string): string {
    return `${API_BASE}/export/${runId}/csv`;
  },

  getPdfExportUrl(runId: string): string {
    return `${API_BASE}/export/${runId}/pdf`;
  },
};
