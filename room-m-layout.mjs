export function visibleRoomMStars(stars, width) {
  const limit = width <= 768 ? 12 : (width < 900 ? 32 : stars.length);
  return stars.slice(0, limit);
}

export function findRoomMStarAt(stars, x, y) {
  return stars.find(star => {
    if (!Number.isFinite(star.x) || !Number.isFinite(star.y)) return false;
    return Math.hypot(star.x - x, star.y - y) < 20 + Math.min(5, star.brightness) * 2;
  }) || null;
}

export function nearestRoomMStars(stars, selectedId, x, y, limit = 2) {
  return stars
    .filter(star => star.id !== selectedId && Number.isFinite(star.x) && Number.isFinite(star.y))
    .map(star => ({ star, distance:Math.hypot(star.x - x, star.y - y) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(item => item.star);
}

export function layoutRoomMStars(stars, safeArea, uiSafeRects = [], { mobile = false } = {}) {
  const { x:safeX, y:safeY, width:safeWidth, height:safeHeight } = safeArea;
  // A small, stable set of separated touch targets on the dedicated mobile stage.
  // Seeded offsets preserve an organic sky without allowing clustered input data
  // (or a single relaxation pass) to stack stars on top of each other.
  if (mobile) {
    const columns = Math.max(1, Math.min(3, stars.length));
    const rows = Math.max(1, Math.ceil(stars.length / columns));
    const cellWidth = safeWidth / columns;
    const cellHeight = safeHeight / rows;
    stars.forEach((star, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      star.x = safeX + (column + .5) * cellWidth + (star.relX - .5) * cellWidth * .2;
      star.y = safeY + (row + .5) * cellHeight + (star.relY - .5) * cellHeight * .2;
    });
    return stars;
  }
  stars.forEach(star => {
    if (!Number.isFinite(star.x) || !Number.isFinite(star.y)) {
      star.x = safeX + star.relX * safeWidth;
      star.y = safeY + star.relY * safeHeight;
    }
  });

  for (let i = 0; i < stars.length; i += 1) {
    for (let j = i + 1; j < stars.length; j += 1) {
      const first = stars[i];
      const second = stars[j];
      let dx = second.x - first.x;
      let dy = second.y - first.y;
      let distance = Math.hypot(dx, dy);
      if (distance === 0) {
        dx = 1;
        dy = 1;
        distance = Math.SQRT2;
      }
      const area = Math.max(safeWidth * safeHeight, 1);
      const minDistance = Math.max(28, Math.min(85, Math.sqrt(area / Math.max(stars.length, 1)) * 0.72));
      if (distance < minDistance) {
        const push = Math.min(2.2, (minDistance - distance) * 0.12);
        const nx = dx / distance;
        const ny = dy / distance;
        first.x -= nx * push;
        first.y -= ny * push;
        second.x += nx * push;
        second.y += ny * push;
      }
    }

    const star = stars[i];
    star.x = Math.min(safeX + safeWidth, Math.max(safeX, star.x));
    star.y = Math.min(safeY + safeHeight, Math.max(safeY, star.y));
    uiSafeRects.forEach(rect => {
      if (star.x <= rect.left || star.x >= rect.right || star.y <= rect.top || star.y >= rect.bottom) return;
      const edges = [
        ['left', star.x - rect.left], ['right', rect.right - star.x],
        ['top', star.y - rect.top], ['bottom', rect.bottom - star.y]
      ].sort((a, b) => a[1] - b[1]);
      if (edges[0][0] === 'left') star.x = rect.left;
      else if (edges[0][0] === 'right') star.x = rect.right;
      else if (edges[0][0] === 'top') star.y = rect.top;
      else star.y = rect.bottom;
    });
  }
  return stars;
}
