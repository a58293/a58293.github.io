import fs from 'fs';

async function run() {
  const baseUrl = "https://raw.githubusercontent.com/a58293/panl-d/main/images";
  const projects = [];
  
  for (let id = 1; id <= 13; id++) {
    const idStr = String(id).padStart(2, '0');
    let count = 0;
    
    // Check up to 20 images
    for (let i = 1; i <= 20; i++) {
      const url = `${baseUrl}/graphic/${idStr}-${i}.webp`;
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.status === 200) {
          count++;
        } else {
          // If we hit a 404, we assume no more images.
          // Wait, sometimes there are gaps? Let's check up to 20 anyway to be safe, but just record the valid ones.
          // Actually, let's just record the max valid index.
        }
      } catch (e) {
      }
    }
    projects.push({ id, count });
    console.log(`Project ${idStr} has ${count} images.`);
  }
}
run();
