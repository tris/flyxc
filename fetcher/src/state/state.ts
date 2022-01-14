import { FetcherState } from 'flyxc/common/protos/fetcher-state';

import { importFromStorage } from './serialize';

export const BUCKET_NAME = 'fly-xc.appspot.com';

// Update the state version when the shape change (i.e. proto).
const STATE_FOLDER = process.env.NODE_ENV == 'development' ? 'fetcher.dev' : 'fetcher';
const STATE_VERSION = 1;
export const PERIODIC_STATE_FILE = `${STATE_FOLDER}/state_v${STATE_VERSION}.brotli`;
export const SHUTDOWN_STATE_FILE = `${STATE_FOLDER}/state_v${STATE_VERSION}.shutdown.brotli`;

export const EXPORT_FILE_SEC = 4 * 3600;
export const FULL_SYNC_SEC = 24 * 3600;
export const PARTIAL_SYNC_SEC = 10 * 60;

// Create the initial empty state.
export function createInitState(): FetcherState {
  const nowSec = Math.round(Date.now() / 1000);

  return {
    version: 1,

    startedSec: nowSec,
    reStartedSec: nowSec,
    stoppedSec: 0,
    lastTickSec: 0,
    numTicks: 0,
    numStarts: 0,

    lastUpdatedMs: 0,

    nextPartialSyncSec: nowSec + PARTIAL_SYNC_SEC,
    nextFullSyncSec: nowSec + FULL_SYNC_SEC,
    nextExportSec: nowSec + EXPORT_FILE_SEC,

    memRssMb: 0,
    memHeapMb: 0,

    inTick: false,
    pilots: {},
  };
}

// Restore the state from periodic or shutdown exports.
//
// Returns the passed state when no serialized state is found.
export async function restoreState(state: FetcherState): Promise<FetcherState> {
  const states: FetcherState[] = [];

  try {
    states.push(await importFromStorage(BUCKET_NAME, PERIODIC_STATE_FILE));
  } catch (e) {
    console.log(`Can not restore periodic state`);
  }

  try {
    states.push(await importFromStorage(BUCKET_NAME, SHUTDOWN_STATE_FILE));
  } catch (e) {
    console.log(`Can not restore shutdown state`);
  }

  // Use the most recent state.
  if (states.length > 0) {
    let index = 0;
    let maxTickSec = states[0].lastTickSec;
    for (let i = 1; i < states.length; i++) {
      if (states[i].lastTickSec > maxTickSec) {
        index = i;
        maxTickSec = states[i].lastTickSec;
      }
    }
    return states[index];
  }

  return state;
}