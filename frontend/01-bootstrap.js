import { createSoulView } from "./soul-view.mjs";
import { createSoulActions } from "./soul-actions.mjs";
import { createSoulAutoBackup, createSoulSyncUI } from "./soul-sync-controller.mjs";
import { createRealtimeLifecycle } from "./realtime-lifecycle.mjs";
import { collection, onSnapshot, doc, serverTimestamp, query, orderBy, where, setDoc, getDoc, limit as firestoreLimit, Timestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { app, callables, db, runtimeProfile } from "./firebase-client.mjs";
import { createRoomECanvas } from "./room-e-canvas.mjs";
import { createRoomEController } from "./room-e-controller.mjs";
import { createRoomEFeedView } from "./room-e-feed.mjs";
import { createRoomMStarModel, ROOM_M_STAR_COLORS } from "./room-m-model.mjs";
import { findRoomMStarAt, layoutRoomMStars, nearestRoomMStars, visibleRoomMStars } from "./room-m-layout.mjs";
import { createRoomPShardModel } from "./room-p-model.mjs";
import { createRoomTFeedModel } from "./room-t-feed.mjs";
import { createRoomPCanvas } from "./room-p-canvas.mjs";
import { normalizeJourney, mergeJourneys } from "./soul-model.mjs";
import { createSoulBackupService } from "./soul-backup-service.mjs";
import { createSubmissionService } from "./submission-service.mjs";
import { createSafeStorage, getBrowserStorage } from "./storage-resilience.mjs";

const {
    submitContentReport,
    submitRoomContent,
    deleteRoomContent:deleteRoomContentRequest,
    reactToRoomContent:reactToRoomContentRequest,
    joinSilentCompanionship:joinSilentCompanionshipRequest,
    recordSiteVisit:recordSiteVisitRequest,
    retireLegacySoulJourney:retireLegacySoulJourneyRequest,
    deleteSoulJourney:deleteSoulJourneyRequest
} = callables;
const safeLocalStorage = createSafeStorage(getBrowserStorage('localStorage'));
const safeSessionStorage = createSafeStorage(getBrowserStorage('sessionStorage'));
const roomPShards = createRoomPShardModel();
const roomTFeed = createRoomTFeedModel({ isHidden:id => window.EmpathSafety?.isHidden('warmth', id) });
window.EmpathStorage = Object.freeze({ local:safeLocalStorage, session:safeSessionStorage });
window.EmpathRuntime = runtimeProfile;
document.documentElement.dataset.empathRuntime = runtimeProfile.kind;
let memoryDriftClientId = '';

function generateDriftClientId() {
    const bytes = new Uint8Array(16);
    globalThis.crypto?.getRandomValues?.(bytes);
    if (!bytes.some(Boolean)) bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function getDriftClientId() {
    if (memoryDriftClientId) return memoryDriftClientId;
    const saved = safeLocalStorage.getItem('empath_drift_client_id') || '';
    if (/^[a-f0-9]{32}$/.test(saved)) return (memoryDriftClientId = saved);
    memoryDriftClientId = generateDriftClientId();
    safeLocalStorage.setItem('empath_drift_client_id', memoryDriftClientId);
    return memoryDriftClientId;
}

const { createRoomContent } = createSubmissionService({
    storage:safeLocalStorage,
    submitRoomContent,
    rememberOwnedContent:(...args) => window.EmpathSafety?.rememberOwnedContent(...args),
    onReceiptStored:room => {
        if (room === 'e') window.renderEFeed?.();
        if (room === 'p') window.renderPShards?.();
        if (room === 't') window.renderTWarmthFeed?.();
    }
});

const roomEController = createRoomEController({
    createPublicContent:createRoomContent,
    sendDriftLetter:callables.sendDriftLetter,
    receiveDriftLetter:callables.receiveDriftLetter,
    getClientId:getDriftClientId
});

const roomECanvas = createRoomECanvas({
    document,
    browserWindow:window,
    getContentMode:() => roomEController.getState().contentMode,
    onBrushVolume:speed => window.setBrushVolume?.(speed)
});

const roomEFeed = createRoomEFeedView({
    document,
    translate:(...copy) => t(...copy),
    formatTime:createdAt => createdAt?.seconds
        ? new Date(createdAt.seconds * 1000).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
        : nowStr(),
    createContentActions:(collectionName, id, onHidden) => window.EmpathSafety?.createContentActions(collectionName, id, onHidden)
});
window.renderEFeed = () => roomEFeed.render();
window.toggleEFeed = () => roomEFeed.toggle();
const roomMStars = createRoomMStarModel({ storage:safeLocalStorage });
window.starMessages = roomMStars.getStars();

async function reactToRoomContent(kind, targetId, extra = {}) {
    const response = await reactToRoomContentRequest({ kind, targetId, ...extra });
    const result = response?.data;
    if (!result?.accepted) throw new Error('Room reaction was not accepted.');
    return result;
}

function isDuplicateRoomReaction(error) {
    return String(error?.code || '').endsWith('already-exists');
}

function showRoomSubmissionError(error) {
    console.error('Room submission failed:', error);
    const code = String(error?.code || '');
    const message = code.endsWith('resource-exhausted')
        ? t('短時間內已送出較多內容，請稍後再回來。', 'You have shared several times recently. Please try again later.')
        : t('暫時無法送出，文字仍為你保留', 'Could not send. Your text is still here.', '送信できませんでした。文章は残っています。', 'No se pudo enviar. Tu texto sigue aquí.', 'Envoi impossible. Votre texte est conservé.', 'Senden fehlgeschlagen. Dein Text bleibt erhalten.', '暂时无法送出，文字仍为你保留');
    window.showToast(message);
}

