import { mergeJourneys, mergeSoulLetters } from './soul-model.mjs';

// Manual operations retain their existing order. UI validation, confirmation,
// feedback and input clearing remain with the caller.
export function createSoulActions({ getJourney, applyJourney, setKey, removeKey, readSoulBackup, writeSoulBackup, retireLegacySoulBackup, deleteSoulJourney, now = Date.now }) {
    async function loadExistingKey(key) {
        const cloud = await readSoulBackup(key);
        if (!cloud) return false;
        applyJourney(mergeJourneys(getJourney(), cloud.journey));
        setKey(key);
        await writeSoulBackup(key, getJourney(), cloud.letters);
        if (cloud.legacy) await retireLegacySoulBackup(key);
        return true;
    }

    async function sealFutureLetter(key, text, unlockDate) {
        const cloud = await readSoulBackup(key);
        const mergedJourney = mergeJourneys(getJourney(), cloud?.journey || {});
        const letters = mergeSoulLetters(cloud?.letters || [], [{ content:text, unlockDate, createdAt:now() }]);
        await writeSoulBackup(key, mergedJourney, letters);
        if (cloud?.legacy) await retireLegacySoulBackup(key);
    }

    // Invoke only after the UI has received confirmation.
    async function deleteConfirmedBackup(key) {
        const response = await deleteSoulJourney({ soulKey:key });
        if (!response?.data?.completed) throw new Error('Soul backup deletion was not completed.');
        removeKey();
    }

    return Object.freeze({ loadExistingKey, sealFutureLetter, deleteConfirmedBackup });
}
