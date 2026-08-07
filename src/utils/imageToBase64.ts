/**
 * Convert an image URL to a base64 data URI.
 * Useful for @react-pdf/renderer which can't always fetch cross-origin images.
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  // Already a data URI
  if (url.startsWith('data:')) return url;
  
  // Local asset - return as-is (works in react-pdf)
  if (url.startsWith('/assets/') || url.startsWith('/images/')) return url;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('[imageToBase64] Failed to convert, using original URL:', error);
    return url;
  }
}
