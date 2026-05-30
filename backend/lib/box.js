/**
 * Box client for rekindle.
 * Uses Client Credentials Grant (CCG) — no user OAuth needed.
 * Stores all app data as JSON files inside a Box folder.
 *
 * Folder structure in Box:
 *   /rekindle-demo/
 *     data/
 *       people.json
 *       memories.json
 *       public_events.json
 *       opportunity_cards.json
 *       sent_messages.json
 *       users.json
 */

const BoxSDK = require("box-node-sdk").default || require("box-node-sdk");

const CLIENT_ID     = process.env.BOX_CLIENT_ID;
const CLIENT_SECRET = process.env.BOX_CLIENT_SECRET;
const ENTERPRISE_ID = process.env.BOX_ENTERPRISE_ID;
// Root folder — "0" means root of the service account
const ROOT_FOLDER   = process.env.BOX_DATA_FOLDER_ID || "0";

// File ID cache so we don't search on every read/write
const fileIdCache = {};
// Folder ID cache
const folderIdCache = {};

let _client = null;

function getClient() {
  if (_client) return _client;

  if (!CLIENT_ID || !CLIENT_SECRET || !ENTERPRISE_ID) {
    throw new Error(
      "Box credentials missing. Set BOX_CLIENT_ID, BOX_CLIENT_SECRET, BOX_ENTERPRISE_ID in .env"
    );
  }

  const sdk = new BoxSDK({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    enterpriseID: ENTERPRISE_ID,
  });

  // CCG service-account client. In box-node-sdk v4 this is exposed as
  // getAnonymousClient() — name is misleading but it IS the enterprise
  // service account that maps to the CCG grant.
  _client = sdk.getAnonymousClient();
  return _client;
}

// ── Folder helpers ────────────────────────────────────────────────────────────

/**
 * Get or create a subfolder by name inside parentFolderId.
 */
async function getOrCreateFolder(name, parentFolderId = ROOT_FOLDER) {
  const cacheKey = `${parentFolderId}/${name}`;
  if (folderIdCache[cacheKey]) return folderIdCache[cacheKey];

  const client = getClient();

  // List items in parent to find existing folder
  const items = await client.folders.getItems(parentFolderId, { fields: "id,name,type" });
  const existing = items.entries.find((e) => e.type === "folder" && e.name === name);

  if (existing) {
    folderIdCache[cacheKey] = existing.id;
    return existing.id;
  }

  // Create it
  const created = await client.folders.create(parentFolderId, name);
  folderIdCache[cacheKey] = created.id;
  console.log(`[box] Created folder: ${name} (${created.id})`);
  return created.id;
}

/**
 * Get the /rekindle-demo/data folder ID, creating it if needed.
 */
async function getDataFolderId() {
  const rekindleFolder = await getOrCreateFolder("rekindle-demo", ROOT_FOLDER);
  return getOrCreateFolder("data", rekindleFolder);
}

// ── File helpers ──────────────────────────────────────────────────────────────

/**
 * Find a file by name in a folder. Returns file ID or null.
 */
async function findFile(filename, folderId) {
  const cacheKey = `${folderId}/${filename}`;
  if (fileIdCache[cacheKey]) return fileIdCache[cacheKey];

  const client = getClient();
  const items = await client.folders.getItems(folderId, { fields: "id,name,type" });
  const file = items.entries.find((e) => e.type === "file" && e.name === filename);

  if (file) {
    fileIdCache[cacheKey] = file.id;
    return file.id;
  }
  return null;
}

/**
 * Read a JSON file from Box. Returns parsed object or defaultValue if not found.
 */
async function readJSON(filename, defaultValue = []) {
  try {
    const folderId = await getDataFolderId();
    const fileId = await findFile(filename, folderId);

    if (!fileId) {
      console.log(`[box] File not found: ${filename}, returning default`);
      return defaultValue;
    }

    const client = getClient();
    const stream = await client.files.getReadStream(fileId);

    return new Promise((resolve, reject) => {
      let data = "";
      stream.on("data", (chunk) => (data += chunk));
      stream.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.error(`[box] Failed to parse ${filename}:`, e.message);
          resolve(defaultValue);
        }
      });
      stream.on("error", reject);
    });
  } catch (err) {
    console.error(`[box] readJSON error for ${filename}:`, err.message);
    return defaultValue;
  }
}

/**
 * Write a JSON file to Box. Creates or overwrites.
 */
async function writeJSON(filename, data) {
  try {
    const folderId = await getDataFolderId();
    const client = getClient();
    const content = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(content, "utf-8");

    const existingId = await findFile(filename, folderId);

    if (existingId) {
      // Overwrite existing file
      await client.files.uploadNewFileVersion(existingId, buffer);
      console.log(`[box] Updated: ${filename}`);
    } else {
      // Create new file
      const uploaded = await client.files.uploadFile(folderId, filename, buffer);
      const newId = uploaded.entries[0].id;
      const cacheKey = `${folderId}/${filename}`;
      fileIdCache[cacheKey] = newId;
      console.log(`[box] Created: ${filename} (${newId})`);
    }
  } catch (err) {
    console.error(`[box] writeJSON error for ${filename}:`, err.message);
    throw err;
  }
}

/**
 * Health check — verify Box connection works by fetching the service
 * account's own user info. Works under CCG without enterprise scopes.
 */
async function ping() {
  const client = getClient();
  const me = await client.users.get(client.CURRENT_USER_ID);
  return { ok: true, as: me.login, id: me.id };
}

module.exports = { readJSON, writeJSON, ping, getDataFolderId };
