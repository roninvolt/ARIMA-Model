import salesCsv from '../../../data/sample_dataset.csv?raw';
import trafficCsv from '../../../data/website_visitors.csv?raw';
import energyCsv from '../../../data/energy_demand.csv?raw';

export const BUNDLED_CSV_MAP: Record<string, { filename: string; content: string; dateCol: string; targetCol: string }> = {
  sales: {
    filename: 'sample_dataset.csv',
    content: salesCsv,
    dateCol: 'date',
    targetCol: 'sales',
  },
  traffic: {
    filename: 'website_visitors.csv',
    content: trafficCsv,
    dateCol: 'timestamp',
    targetCol: 'visitors',
  },
  energy: {
    filename: 'energy_demand.csv',
    content: energyCsv,
    dateCol: 'month',
    targetCol: 'megawatt_hours',
  },
};
