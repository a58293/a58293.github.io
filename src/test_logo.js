async function run() {
  const url = "https://raw.githubusercontent.com/a58293/panl-d/main/images/logo/01.webp";
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`Status: ${res.status}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}
run();
