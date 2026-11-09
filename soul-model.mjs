// Soul data normalization and merge rules, independent of storage and UI.
export function normalizeJourney(source = {}) {
    const counters = {};
    ['e','m','p','a','t'].forEach(type => {
        counters[type] = Math.max(0, Number(source?.counters?.[type]) || 0);
    });
    const events = Array.isArray(source.events)
        ? source.events.filter(event => event && ['e','m','p','a','t'].includes(event.type)).map(event => ({
            type:event.type,
            text:typeof event.text === 'string' ? event.text.slice(0, 500) : '',
            time:typeof event.time === 'string' ? event.time.slice(0, 20) : ''
        }))
        : [];
    return { counters, events, visitCount:Math.max(0, Number(source.visitCount) || 0) };
}

export function mergeJourneys(localSource, cloudSource) {
    const local = normalizeJourney(localSource);
    const cloud = normalizeJourney(cloudSource);
    const counters = {};
    ['e','m','p','a','t'].forEach(type => { counters[type] = Math.max(local.counters[type], cloud.counters[type]); });
    const seen = new Set();
    const events = [...cloud.events, ...local.events].filter(event => {
        const signature = `${event.type}\u0000${event.time}\u0000${event.text}`;
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
    }).slice(-500);
    return { counters, events, visitCount:Math.max(local.visitCount, cloud.visitCount) };
}

export function normalizeSoulLetters(source) {
    return Array.isArray(source)
        ? source.filter(letter => letter && typeof letter.content === 'string').map(letter => ({
            content:letter.content.slice(0, 5000),
            unlockDate:Math.max(0, Number(letter.unlockDate) || 0),
            createdAt:Math.max(0, Number(letter.createdAt) || 0)
        })).filter(letter => letter.content && letter.unlockDate && letter.createdAt).slice(-50)
        : [];
}

export function mergeSoulLetters(...sources) {
    const seen = new Set();
    return sources.flatMap(normalizeSoulLetters).filter(letter => {
        const signature = `${letter.createdAt}\u0000${letter.unlockDate}\u0000${letter.content}`;
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
    }).sort((a, b) => a.createdAt - b.createdAt).slice(-50);
}

