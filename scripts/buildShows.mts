import path from 'path';
import fetchShows from './fetchShows.mts';

await fetchShows(path.resolve(import.meta.dirname, '..', 'demo'));
