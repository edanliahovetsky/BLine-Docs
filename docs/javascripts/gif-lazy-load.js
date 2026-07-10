/**
 * Turn documentation GIFs into user-controlled, single-play demonstrations.
 * Each source image supplies start/end posters and its duration through data attributes.
 */

function initGifDemos() {
  document.querySelectorAll('img.gif-demo:not([data-gif-processed])').forEach((gif) => {
    const originalSrc = gif.currentSrc || gif.src;
    const posterSrc = gif.dataset.gifPoster;
    const endSrc = gif.dataset.gifEnd || posterSrc;
    const durationMs = Number.parseInt(gif.dataset.gifDuration || '0', 10);

    if (!originalSrc || !posterSrc || !endSrc || !Number.isFinite(durationMs) || durationMs <= 0) {
      return;
    }

    gif.dataset.gifProcessed = 'true';
    gif.dataset.gifSource = originalSrc;
    gif.src = posterSrc;

    const wrapper = document.createElement('span');
    wrapper.className = 'gif-wrapper';
    wrapper.setAttribute('role', 'group');
    wrapper.setAttribute('aria-label', `Animation: ${gif.alt || 'BLine Web demonstration'}`);
    gif.parentNode.insertBefore(wrapper, gif);
    wrapper.appendChild(gif);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gif-control';
    button.textContent = 'Play demo';
    button.setAttribute('aria-label', `Play animation: ${gif.alt || 'BLine Web demonstration'}`);
    wrapper.appendChild(button);

    let stopTimer;

    const showEndState = () => {
      window.clearTimeout(stopTimer);
      gif.src = endSrc;
      wrapper.dataset.gifState = 'finished';
      button.textContent = 'Replay demo';
      button.setAttribute('aria-label', `Replay animation: ${gif.alt || 'BLine Web demonstration'}`);
    };

    const play = () => {
      window.clearTimeout(stopTimer);
      const separator = originalSrc.includes('?') ? '&' : '?';
      gif.src = `${originalSrc}${separator}replay=${Date.now()}`;
      wrapper.dataset.gifState = 'playing';
      button.textContent = 'Stop demo';
      button.setAttribute('aria-label', `Stop animation: ${gif.alt || 'BLine Web demonstration'}`);
      stopTimer = window.setTimeout(showEndState, durationMs);
    };

    button.addEventListener('click', () => {
      if (wrapper.dataset.gifState === 'playing') {
        showEndState();
      } else {
        play();
      }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGifDemos);
} else {
  initGifDemos();
}

document.addEventListener('DOMContentSwitch', initGifDemos);

if (typeof location$ !== 'undefined') {
  location$.subscribe(initGifDemos);
}
