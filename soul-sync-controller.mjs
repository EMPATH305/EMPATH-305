import { mergeJourneys } from './soul-model.mjs';

// One queue per page; capture the key at enqueue time and read the journey
// after the cloud read, matching the existing automatic backup behavior.
export function createSoulAutoBackup({ getKey, getJourney, readSoulBackup, writeSoulBackup, retireLegacySoulBackup, onError }) {
    let queue = Promise.resolve();
    return async function autoBackupToCloud() {
        const key = getKey();
        if (!key) return false;
        queue = queue.catch(() => false).then(async () => {
            try {
                const cloud = await readSoulBackup(key);
                const mergedJourney = mergeJourneys(getJourney(), cloud?.journey || {});
                const letters = cloud?.letters || [];
                await writeSoulBackup(key, mergedJourney, letters);
                if (cloud?.legacy) await retireLegacySoulBackup(key);
                return true;
            } catch (error) {
                onError(error);
                return false;
            }
        });
        return queue;
    };
}

// Optional Room H elements are resolved only when the UI is refreshed.
export function createSoulSyncUI({ getElement, getKey, checkFutureLetters }) {
    return function updateSyncUI() {
        const initial = getElement('sync-initial-actions');
        const active = getElement('sync-active-actions');
        if (!initial || !active) return;
        const key = getKey();
        if (key) {
            initial.style.display = 'none';
            active.style.display = 'flex';
            const futureLetterBox = getElement('future-letter-box');
            if (futureLetterBox) futureLetterBox.style.display = 'block';
            checkFutureLetters();
            const display = getElement('active-key-display');
            if (display) display.textContent = key;
        } else {
            initial.style.display = 'flex';
            active.style.display = 'none';
        }
    };
}
