/**
 * Extracts the average color from an image URL and returns a "harmonious" version of it.
 * Harmonious means low saturation and high brightness to serve as a subtle background.
 */
export async function getHarmoniousColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("#f9f9f9");
        return;
      }

      canvas.width = 10; // Small size for performance
      canvas.height = 10;
      ctx.drawImage(img, 0, 0, 10, 10);

      const imageData = ctx.getImageData(0, 0, 10, 10).data;
      let r = 0, g = 0, b = 0;

      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
      }

      const count = imageData.length / 4;
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);

      // Convert to HSL to adjust saturation and lightness
      const { h, s, l } = rgbToHsl(r, g, b);
      
      // Force a "warm/harmonious" feel: low saturation (10-20%), high lightness (92-96%)
      const finalS = Math.min(s, 15); 
      const finalL = Math.max(l, 94);

      resolve(`hsl(${h}, ${finalS}%, ${finalL}%)`);
    };

    img.onerror = () => {
      resolve("#f9f9f9");
    };
  });
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
