import { completeSubmissionRequest, getOrCreateSubmissionRequest } from "./storage-resilience.mjs";

// Keep retry identifiers until both acceptance and local receipt handling complete.
export function createSubmissionService({ storage, submitRoomContent, rememberOwnedContent, onReceiptStored }) {
    async function createRoomContent(room, payload = {}, returnResult = false) {
        const pendingRequest = await getOrCreateSubmissionRequest(storage, room, payload);
        const response = await submitRoomContent({ room, ...payload, requestId:pendingRequest.requestId });
        const result = response?.data;
        if (!result?.accepted || typeof result.id !== 'string' || !result.id) {
            throw new Error('Room submission was not accepted.');
        }
        const ownedCollectionByRoom = { e:'emotions', m:'stars', p:'shards', t:'warmth' };
        const ownedCollection = ownedCollectionByRoom[room];
        let submissionLocallyComplete = true;
        if (ownedCollection && typeof result.deletionToken === 'string') {
            const receiptStored = rememberOwnedContent?.(
                ownedCollection,
                result.id,
                result.deletionToken,
                result.deletionExpiresAt
            );
            submissionLocallyComplete = Boolean(receiptStored);
            if (receiptStored) onReceiptStored?.(room);
        }
        if (submissionLocallyComplete) {
            completeSubmissionRequest(storage, room, pendingRequest.requestId);
        }
        return returnResult ? result : result.id;
    }
    return Object.freeze({ createRoomContent });
}
