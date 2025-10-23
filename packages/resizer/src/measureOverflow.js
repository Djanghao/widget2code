/**
 * @file measureOverflow.js
 * @description Detects if widget content overflows its container.
 * Checks both scroll dimensions and child element boundaries.
 */

/**
 * Measures if element content fits within its container
 * @param {HTMLElement} element - The widget container element to measure
 * @returns {Object} Measurement result
 * @returns {boolean} returns.fits - Whether content fits without overflow
 * @returns {number} returns.clientWidth - Container's client width
 * @returns {number} returns.clientHeight - Container's client height
 * @returns {number} returns.scrollWidth - Content's scroll width
 * @returns {number} returns.scrollHeight - Content's scroll height
 */
export function measureOverflow(element) {
  if (!element) return { fits: false };

  const cw = element.clientWidth;
  const ch = element.clientHeight;
  const sw = element.scrollWidth;
  const sh = element.scrollHeight;

  let fits = sw <= cw && sh <= ch;

  try {
    const rootRect = element.getBoundingClientRect();
    const cs = window.getComputedStyle(element);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const padT = parseFloat(cs.paddingTop) || 0;
    const padB = parseFloat(cs.paddingBottom) || 0;
    const innerLeft = rootRect.left + padL;
    const innerRight = rootRect.right - padR;
    const innerTop = rootRect.top + padT;
    const innerBottom = rootRect.bottom - padB;

    const tol = 0.5;

    let crossesPaddingOrOutside = false;
    const all = element.querySelectorAll('*');
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (el === element) continue;
      const r = el.getBoundingClientRect();
      if ((r.width || 0) <= 0 && (r.height || 0) <= 0) continue;

      if (r.left < rootRect.left - tol || r.right > rootRect.right + tol || r.top < rootRect.top - tol || r.bottom > rootRect.bottom + tol) {
        crossesPaddingOrOutside = true;
        break;
      }
      if (r.left < innerLeft - tol || r.right > innerRight + tol || r.top < innerTop - tol || r.bottom > innerBottom + tol) {
        crossesPaddingOrOutside = true;
        break;
      }
    }

    if (crossesPaddingOrOutside) {
      fits = false;
    }
    return { fits, clientWidth: cw, clientHeight: ch, scrollWidth: sw, scrollHeight: sh };
  } catch (e) {
    return { fits, clientWidth: cw, clientHeight: ch, scrollWidth: sw, scrollHeight: sh };
  }
}
