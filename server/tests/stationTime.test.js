import test from 'node:test';
import assert from 'node:assert/strict';
import { stationDateString } from '../utils/stationTime.js';

test('station date uses the configured India-local calendar date by default', () => {
  const previous = process.env.STATION_TIME_ZONE;
  delete process.env.STATION_TIME_ZONE;
  assert.equal(stationDateString(new Date('2026-10-09T20:00:00.000Z')), '2026-10-10');
  if (previous !== undefined) process.env.STATION_TIME_ZONE = previous;
});

test('station date respects an explicitly configured station timezone', () => {
  const previous = process.env.STATION_TIME_ZONE;
  process.env.STATION_TIME_ZONE = 'UTC';
  assert.equal(stationDateString(new Date('2026-10-09T20:00:00.000Z')), '2026-10-09');
  if (previous !== undefined) process.env.STATION_TIME_ZONE = previous;
  else delete process.env.STATION_TIME_ZONE;
});
