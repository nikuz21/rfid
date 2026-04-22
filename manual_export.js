const Database = require("@replit/database/index.js");
const db = new Database();
const fs = require("fs");

async function runExport() {
  try {
    console.log("Fetching all keys...");
    const keys = await db.list();
    const exportObj = {};

    for (const key of keys) {
      exportObj[key] = await db.get(key);
      console.log(`Fetched: ${key}`);
    }

    fs.writeFileSync(
      "database_export.json",
      JSON.stringify(exportObj, null, 2),
    );
    console.log("\nSuccess! 'database_export.json' has been created.");
  } catch (err) {
    console.error("Error exporting:", err);
  }
}

runExport();
