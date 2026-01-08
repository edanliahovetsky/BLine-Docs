/**
 * Lazy-load GIFs - only play when scrolled into view
 * Uses Intersection Observer API for efficient detection
 */

document.addEventListener('DOMContentLoaded', function() {
  // Find all GIF images
  const gifs = document.querySelectorAll('img[src$=".gif"]');
  
  gifs.forEach(gif => {
    // Store original src and replace with placeholder
    const originalSrc = gif.src;
    gif.dataset.src = originalSrc;
    gif.src = '';
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
    rootMargin: '50px', // Start loading slightly before visible
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const gif = entry.target.querySelector('img.gif-lazy');
      if (!gif) return;
      
      if (entry.isIntersecting) {
        // Load and play GIF
        if (gif.dataset.src && !gif.src) {
          gif.src = gif.dataset.src;
          gif.classList.add('gif-loaded');
          entry.target.classList.add('gif-playing');
        }
      }
    });
  }, observerOptions);

  // Observe all GIF wrappers
  document.querySelectorAll('.gif-wrapper').forEach(wrapper => {
    observer.observe(wrapper);
  });
});

// Re-run on navigation (for MkDocs instant loading)
document.addEventListener('DOMContentSwitch', function() {
  // Small delay to ensure DOM is updated
  setTimeout(() => {
    const gifs = document.querySelectorAll('img[src$=".gif"]:not(.gif-lazy)');
    
    gifs.forEach(gif => {
      const originalSrc = gif.src;
      gif.dataset.src = originalSrc;
      gif.src = '';
      gif.classList.add('gif-lazy');
      
      const wrapper = document.createElement('div');
      wrapper.classList.add('gif-wrapper');
      gif.parentNode.insertBefore(wrapper, gif);
      wrapper.appendChild(gif);
      
      const playIcon = document.createElement('div');
      playIcon.classList.add('gif-play-icon');
      playIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
      wrapper.appendChild(playIcon);
    });

    const observerOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const gif = entry.target.querySelector('img.gif-lazy');
        if (!gif) return;
        
        if (entry.isIntersecting) {
          if (gif.dataset.src && !gif.src) {
            gif.src = gif.dataset.src;
            gif.classList.add('gif-loaded');
            entry.target.classList.add('gif-playing');
          }
        }
      });
    }, observerOptions);

    document.querySelectorAll('.gif-wrapper').forEach(wrapper => {
      observer.observe(wrapper);
    });
  }, 100);
});
