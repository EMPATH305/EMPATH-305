export const ROOM_M_STAR_COLORS = Object.freeze([
  Object.freeze({ r:212, g:228, b:255 }),
  Object.freeze({ r:255, g:239, b:213 }),
  Object.freeze({ r:198, g:216, b:231 }),
  Object.freeze({ r:247, g:220, b:200 }),
  Object.freeze({ r:230, g:230, b:250 }),
  Object.freeze({ r:255, g:248, b:231 })
]);

export function normalizeRoomMStar(star, index = 0) {
  const safeStar = star && typeof star === 'object' ? star : {};
  const seed = String(safeStar.id || safeStar.text || index);
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  const seeded = offset => {
    const value = Math.sin(hash + offset) * 10000;
    return value - Math.floor(value);
  };
  return {
    ...safeStar,
    text:typeof safeStar.text === 'string' ? safeStar.text : '',
    brightness:Number.isFinite(Number(safeStar.brightness)) ? Math.max(1, Number(safeStar.brightness)) : 1,
    clicks:Number.isFinite(Number(safeStar.clicks)) ? Number(safeStar.clicks) : 0,
    colorIdx:Number.isInteger(Number(safeStar.colorIdx))
      ? Math.abs(Number(safeStar.colorIdx)) % ROOM_M_STAR_COLORS.length
      : Math.floor(seeded(17) * ROOM_M_STAR_COLORS.length),
    relX:Number.isFinite(Number(safeStar.relX))
      ? Math.min(0.95, Math.max(0.05, Number(safeStar.relX)))
      : 0.05 + seeded(31) * 0.9,
    relY:Number.isFinite(Number(safeStar.relY))
      ? Math.min(0.95, Math.max(0.05, Number(safeStar.relY)))
      : 0.05 + seeded(47) * 0.9
  };
}

export function createRoomMStarModel({ storage, cacheKey = 'empath_stars_cache', maxStars = 80 } = {}) {
  let stars = [];

  function persist() {
    if (!storage) return;
    const safeStars = stars.slice(0, maxStars).map(({ id, text, brightness, clicks, colorIdx, relX, relY }) => ({
      id, text, brightness, clicks, colorIdx, relX, relY
    }));
    storage.setItem(cacheKey, JSON.stringify(safeStars));
  }

  function load() {
    try {
      const raw = storage?.getItem(cacheKey);
      const cached = raw ? JSON.parse(raw) : [];
      stars = Array.isArray(cached) ? cached.map(normalizeRoomMStar).slice(0, maxStars) : [];
    } catch {
      stars = [];
      storage?.removeItem(cacheKey);
    }
    return stars;
  }

  function setStars(nextStars, isHidden = () => false) {
    stars = (Array.isArray(nextStars) ? nextStars : [])
      .filter(star => typeof star?.id === 'string' && !isHidden(star.id))
      .map(normalizeRoomMStar)
      .sort((a, b) => b.brightness - a.brightness)
      .slice(0, maxStars);
    persist();
    return stars;
  }

  function remove(id) {
    stars = stars.filter(star => star.id !== id);
    persist();
    return stars;
  }

  function resetLayout() {
    stars.forEach(star => {
      star.x = undefined;
      star.y = undefined;
    });
  }

  function applyReaction(id, reaction = {}) {
    const star = stars.find(item => item.id === id);
    if (!star) return null;
    star.brightness = Number(reaction.brightness) || star.brightness;
    star.clicks = Number(reaction.clicks) || star.clicks;
    persist();
    return star;
  }

  function getSummary(serverTotal = 0) {
    const brightest = stars.reduce((best, star) => !best || star.brightness > best.brightness ? star : best, null);
    return Object.freeze({
      total:Number(serverTotal) || stars.length,
      brightest:brightest ? (brightest.text.length > 14 ? `${brightest.text.slice(0, 14)}…` : brightest.text) : '—'
    });
  }

  load();
  return Object.freeze({ applyReaction, getStars:() => stars, getSummary, load, persist, remove, resetLayout, setStars });
}
