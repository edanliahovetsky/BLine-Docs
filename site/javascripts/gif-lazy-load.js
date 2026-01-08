/**
 * Lazy-load GIFs - only play when scrolled into view
 * Uses Intersection Observer API for efficient detection
 */

function initGifLazyLoad() {
  // Find all GIF images that haven't been processed
  const gifs = document.querySelectorAll('img[src$=".gif"]:not([data-gif-processed])');
  
  if (gifs.length === 0) return;

  gifs.forEach(gif => {
    // Mark as processed
    gif.dataset.gifProcessed = 'true';
    
    // Store original src
    const originalSrc = gif.src;
    gif.dataset.gifSrc = originalSrc;
    
    // Clear the src to stop the GIF from loading/playing
    gif.removeAttribute('src');
    gif.classList.add('gif-lazy');
    
    // Create wrapper for loading state
    const wrapper = document.createElement('div');
    wrapper.classList.add('gif-wrapper');
    gif.parentNode.insertBefore(wrapper, gif);
    wrapper.appendChild(gif);
    
    // Add play icon overlay
    const playIcon = document.createElement('div');
    playIcon.classList.add('gif-play-icon');
    playIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    wrapper.appendChild(playIcon);
  });

  // Set up Intersection Observer
  const observerOptions = {
    root: null,
    rootMargin: '100px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const wrapper = entry.target;
        const gif = wrapper.querySelector('img.gif-lazy');
        
        if (gif && gif.dataset.gifSrc && !gif.dataset.gifLoaded) {
          // Mark as loaded to prevent re-triggering
          gif.dataset.gifLoaded = 'true';
          
          // Set the src to start loading/playing
          gif.src = gif.dataset.gifSrc;
          gif.classList.add('gif-loaded');
          wrapper.classList.add('gif-playing');
          
          // Stop observing this element
          observer.unobserve(wrapper);
        }
      }
    });
  }, observerOptions);

  // Observe all GIF wrappers
  document.querySelectorAll('.gif-wrapper').forEach(wrapper => {
    if (!wrapper.querySelector('img[data-gif-loaded]')) {
      observer.observe(wrapper);
    }
  });
}

// Run on initial page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGifLazyLoad);
} else {
  initGifLazyLoad();
}

// Re-run on MkDocs instant navigation
document.addEventListener('DOMContentSwitch', function() {
  setTimeout(initGifLazyLoad, 50);
});

// Also listen for the location change event (MkDocs Material)
if (typeof location$ !== 'undefined') {
  location$.subscribe(() => {
    setTimeout(initGifLazyLoad, 50);
  });
}
