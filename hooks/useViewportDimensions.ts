import { useState, useEffect } from 'react';

export interface ViewportDimensions {
  width: number;
  height: number;
  isMobile: boolean;       // < 768px
  isTablet: boolean;       // 768px - 1023px
  isDesktop: boolean;      // >= 1024px
  isWide: boolean;         // >= 1440px
  isPortrait: boolean;
  isLandscape: boolean;
  aspectRatio: number;
}

export function useViewportDimensions(): ViewportDimensions {
  const [dimensions, setDimensions] = useState<ViewportDimensions>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      isWide: width >= 1440,
      isPortrait: height > width,
      isLandscape: width >= height,
      aspectRatio: width / (height || 1)
    };
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setDimensions(prev => {
        if (prev.width === width && prev.height === height) return prev;
        return {
          width,
          height,
          isMobile: width < 768,
          isTablet: width >= 768 && width < 1024,
          isDesktop: width >= 1024,
          isWide: width >= 1440,
          isPortrait: height > width,
          isLandscape: width >= height,
          aspectRatio: width / (height || 1)
        };
      });
    };

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 40);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return dimensions;
}

export default useViewportDimensions;
