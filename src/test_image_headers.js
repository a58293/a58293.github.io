async function run() {
  const url = "https://raw.githubusercontent.com/a58293/panl-d/main/images/graphic/01.webp";
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`Status: ${res.status}`);
    console.log(`Content-Type: ${res.headers.get('content-type')}`);
    console.log(`Content-Length: ${res.headers.get('content-length')}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}
run();
