import { decryptSoulPayload, encryptSoulPayload, isEncryptedSoulRecord, soulStorageId } from "./soul-crypto.mjs";
import { normalizeJourney, normalizeSoulLetters } from "./soul-model.mjs";

// Storage adapters keep Firebase and UI outside the backup format boundary.
export function createSoulBackupService({ readRecord, writeRecord, serverTimestamp, retireLegacy, now = Date.now, onCleanupError = () => {} }) {
    async function readSoulBackup(key) {
        const storageId = await soulStorageId(key);
        const encryptedSnapshot = await readRecord(storageId);
        if (encryptedSnapshot.exists()) {
            const record = encryptedSnapshot.data();
            if (!isEncryptedSoulRecord(record)) throw new Error('Unsupported encrypted Soul backup.');
            const payload = await decryptSoulPayload(key, record);
            return {
                journey:normalizeJourney(payload?.journey),
                letters:normalizeSoulLetters(payload?.letters),
                legacy:false,
                storageId
            };
        }
        const legacySnapshot = await readRecord(key);
        if (!legacySnapshot.exists()) return null;
        const legacy = legacySnapshot.data();
        return {
            journey:normalizeJourney(legacy),
            letters:normalizeSoulLetters(legacy.letters),
            legacy:true,
            storageId
        };
    }

    async function writeSoulBackup(key, nextJourney, letters = []) {
        const encrypted = await encryptSoulPayload(key, {
            journey:normalizeJourney(nextJourney),
            letters:normalizeSoulLetters(letters)
        });
        await writeRecord(encrypted.storageId, {
            ...encrypted.record,
            clientUpdatedAt:now(),
            updatedAt:serverTimestamp()
        });
        return encrypted.storageId;
    }

    async function retireLegacySoulBackup(key) {
        try {
            await retireLegacy({ soulKey:key });
        } catch (error) {
            onCleanupError(error);
        }
    }

    return Object.freeze({ readSoulBackup, writeSoulBackup, retireLegacySoulBackup });
}
