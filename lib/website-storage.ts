import path from 'node:path';

// Keep website artifacts on the same persistent volume as the existing DB.
export function websiteDataRoot() {
  return process.env.WEBSITE_DATA_DIR || (process.env.FOUNDER_OS_DB && process.env.FOUNDER_OS_DB !== ':memory:'
    ? path.dirname(path.resolve(process.env.FOUNDER_OS_DB)) : path.join(process.cwd(), 'data'));
}
