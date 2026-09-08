async function run() {
  const url = "https://raw.githubusercontent.com/a58293/panl-d/main/images/covers/logo.webp";
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`Status for logo.webp: ${res.status}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}
run();
