const cleanedAssets = new Map<string, Promise<string>>();

const isBackground = (pixels: Uint8ClampedArray, offset: number) => {
  const red = pixels[offset];
  const green = pixels[offset + 1];
  const blue = pixels[offset + 2];
  const high = Math.max(red, green, blue);
  const low = Math.min(red, green, blue);
  return (red + green + blue) / 3 >= 216 && high - low <= 16;
};

const createTransparentAsset = (src: string) => new Promise<string>((resolve, reject) => {
  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      reject(new Error("Canvas is unavailable"));
      return;
    }

    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;
    const cornerOffsets = [
      3,
      (canvas.width - 1) * 4 + 3,
      (canvas.height - 1) * canvas.width * 4 + 3,
      (canvas.width * canvas.height - 1) * 4 + 3,
    ];
    if (cornerOffsets.some((offset) => data[offset] < 250)) {
      resolve(src);
      return;
    }
    const total = canvas.width * canvas.height;
    const background = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0;
    let tail = 0;

    const seed = (x: number, y: number) => {
      const index = y * canvas.width + x;
      if (background[index] || !isBackground(data, index * 4)) return;
      background[index] = 1;
      queue[tail++] = index;
    };

    for (let x = 0; x < canvas.width; x += 1) {
      seed(x, 0);
      seed(x, canvas.height - 1);
    }
    for (let y = 0; y < canvas.height; y += 1) {
      seed(0, y);
      seed(canvas.width - 1, y);
    }

    while (head < tail) {
      const index = queue[head++];
      const x = index % canvas.width;
      const y = Math.floor(index / canvas.width);
      let next = 0;
      if (x > 0) {
        next = index - 1;
        if (!background[next] && isBackground(data, next * 4)) {
          background[next] = 1;
          queue[tail++] = next;
        }
      }
      if (x < canvas.width - 1) {
        next = index + 1;
        if (!background[next] && isBackground(data, next * 4)) {
          background[next] = 1;
          queue[tail++] = next;
        }
      }
      if (y > 0) {
        next = index - canvas.width;
        if (!background[next] && isBackground(data, next * 4)) {
          background[next] = 1;
          queue[tail++] = next;
        }
      }
      if (y < canvas.height - 1) {
        next = index + canvas.width;
        if (!background[next] && isBackground(data, next * 4)) {
          background[next] = 1;
          queue[tail++] = next;
        }
      }
    }

    for (let index = 0; index < total; index += 1) {
      if (background[index]) data[index * 4 + 3] = 0;
    }
    context.putImageData(imageData, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Transparent asset could not be created"));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, "image/png");
  };
  image.onerror = () => reject(new Error(`Unable to load ${src}`));
  image.src = src;
});

export const getTransparentGoddess = (src: string) => {
  const cached = cleanedAssets.get(src);
  if (cached) return cached;
  const asset = createTransparentAsset(src);
  cleanedAssets.set(src, asset);
  return asset;
};
