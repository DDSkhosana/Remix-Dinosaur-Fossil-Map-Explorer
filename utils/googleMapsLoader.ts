// Google Maps Platform & Google Earth API Loader
// Mandatory tracking solution ID: gmp_mcp_codeassist_v1_aistudio

export const GOOGLE_MAPS_ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';
export const DEFAULT_MAPS_KEY = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string) || 'AIzaSyBvoEzsTGtVLJk6Z6-WzpikGvF-Cejw49c';

let loaderPromise: Promise<boolean> | null = null;

export async function loadGoogleMapsApi(apiKey: string = DEFAULT_MAPS_KEY): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Check if already loaded
  if ((window as any).google?.maps?.importLibrary) {
    try {
      await (window as any).google.maps.importLibrary('maps3d');
      await (window as any).google.maps.importLibrary('maps');
      await (window as any).google.maps.importLibrary('marker');
      return true;
    } catch (e) {
      console.warn('Google Maps libraries already present or loading with fallback:', e);
      return true;
    }
  }

  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<boolean>((resolve) => {
    // Check if script tag already exists
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      const checkLoaded = () => {
        if ((window as any).google?.maps) {
          resolve(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=alpha&libraries=maps3d,maps,marker,geometry&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = async () => {
      try {
        if ((window as any).google?.maps?.importLibrary) {
          await (window as any).google.maps.importLibrary('maps3d');
          await (window as any).google.maps.importLibrary('maps');
          await (window as any).google.maps.importLibrary('marker');
        }
        resolve(true);
      } catch (err) {
        console.warn('Maps 3D library initialization notice:', err);
        resolve(true);
      }
    };

    script.onerror = (err) => {
      console.error('Failed to load Google Maps API script:', err);
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return loaderPromise;
}

/**
 * Check if WebGL is supported by current client canvas context
 */
export function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}
