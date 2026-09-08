async function run() {
  const baseUrl = "https://raw.githubusercontent.com/a58293/panl-d/main/images";
  const projects = [
    { id: 1, count: 7 },
    { id: 2, count: 1 },
    { id: 3, count: 11 },
    { id: 4, count: 3 },
    { id: 5, count: 4 },
    { id: 6, count: 10 },
    { id: 7, count: 20 },
    { id: 8, count: 12 },
    { id: 9, count: 12 },
    { id: 10, count: 4 },
    { id: 11, count: 9 },
    { id: 12, count: 5 },
    { id: 13, count: 4 },
  ];
  
  for (const p of projects) {
    const id = String(p.id).padStart(2, '0');
    let missing = 0;
    for (let i = 1; i <= p.count; i++) {
      const url = `${baseUrl}/graphic/${id}-${i}.webp`;
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.status !== 200) {
          missing++;
          console.log(`Missing: graphic/${id}-${i}.webp`);
        }
      } catch (e) {
        missing++;
      }
    }
    if (missing > 0) {
      console.log(`Project ${id} has ${missing} missing images.`);
    }
  }
}
run();
