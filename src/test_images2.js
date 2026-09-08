async function run() {
  const urls = [
    "https://raw.githubusercontent.com/a58293/panl-d/main/images/installation/14.webp",
    "https://raw.githubusercontent.com/a58293/panl-d/main/images/installation/16.webp",
    "https://raw.githubusercontent.com/a58293/panl-d/main/images/installation/17.webp",
    "https://raw.githubusercontent.com/a58293/panl-d/main/images/graphic/01.webp",
    "https://raw.githubusercontent.com/a58293/panl-d/main/images/graphic/01-1.webp"
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`${url}: ${res.status}`);
    } catch (e) {
      console.log(`${url}: error`);
    }
  }
}
run();
