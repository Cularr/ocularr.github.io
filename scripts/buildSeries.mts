import path from 'path';
import fetchSeries from './fetchSeries.mts';

await fetchSeries(path.resolve(import.meta.dirname, '..', 'demo'));
