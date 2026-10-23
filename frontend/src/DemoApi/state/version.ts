import { INSTALLED_VERSION, LATEST_VERSION } from '../constants';
import { DemoDb } from './store';

export function currentVersion(db: DemoDb) {
  return db.updateInstalled ? LATEST_VERSION : INSTALLED_VERSION;
}
