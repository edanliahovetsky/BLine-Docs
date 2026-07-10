/**
 * Loop documentation GIFs only while they are visible. Readers who prefer
 * reduced motion, and pages rendered for print, receive the static poster.
 */

const gifReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const gifDemos = new Set();

function showGifPoster(gif, showEndState = false) {
  const posterSrc = showEndState
    ? gif.dataset.gifEnd || gif.dataset.gifPoster
    : gif.dataset.gifPoster;
  if (posterSrc && gif.getAttribute('src') !== posterSrc) {
    gif.src = posterSrc;
  }
  gif.dataset.gifState = showEndState ? 'static-end' : 'poster';
}

function playGif(gif) {
  if (gifReducedMotion.matches) {
    showGifPoster(gif, true);
    return;
  }

  if (document.hidden) {
    showGifPoster(gif);
    return;
  }

  const source = gif.dataset.gifSource;
  if (!source || gif.dataset.gifState === 'playing') {
    return;
  }

  const separator = source.includes('?') ? '&' : '?';
  gif.src = `${source}${separator}visible=${Date.now()}`;
  gif.dataset.gifState = 'playing';
}

const gifObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.15) {
            playGif(entry.target);
          } else {
            showGifPoster(entry.target);
          }
        });
      },
      { threshold: [0, 0.15] }
    )
  : null;

function initGifDemos() {
  document.querySelectorAll('img.gif-demo:not([data-gif-processed])').forEach((gif) => {
    const source = gif.dataset.gifSource;
    const poster = gif.dataset.gifPoster;
    if (!source || !poster) {
      return;
    }

    gif.dataset.gifProcessed = 'true';
    gifDemos.add(gif);
    showGifPoster(gif);

    if (gifObserver) {
      gifObserver.observe(gif);
    } else {
      playGif(gif);
    }
  });
}

function refreshGifMotion() {
  gifDemos.forEach((gif) => {
    if (!gif.isConnected) {
      gifDemos.delete(gif);
      gifObserver?.unobserve(gif);
      return;
    }

    if (gifReducedMotion.matches) {
      showGifPoster(gif, true);
    } else if (document.hidden) {
      showGifPoster(gif);
    } else if (!gifObserver) {
      playGif(gif);
    } else {
      gifObserver.unobserve(gif);
      gifObserver.observe(gif);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGifDemos);
} else {
  initGifDemos();
}

document.addEventListener('visibilitychange', refreshGifMotion);
gifReducedMotion.addEventListener('change', refreshGifMotion);
document.addEventListener('DOMContentSwitch', initGifDemos);

if (typeof location$ !== 'undefined') {
  location$.subscribe(initGifDemos);
}
