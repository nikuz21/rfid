async function debugExport() {
  const url = process.env.REPLIT_DB_URL;
  if (!url) return console.log("ERROR: Walang DB URL!");

  const response = await fetch(`${url}?prefix=`);
  const keysText = await response.text();
  console.log("Keys found:", keysText); // Dapat may listahan dito

  if (!keysText.trim()) {
    console.log("Talagang walang laman ang database mo.");
    return;
  }
}
debugExport();
