import type { OfflineOperation } from "./types";

const DB_NAME = "flowentra-offline-db";
const DB_VERSION = 2;
const STORE_NAME = "operations";
const BLOBS_STORE_NAME = "operation_blobs";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "opId" });
        store.createIndex("clientTimestamp", "clientTimestamp", { unique: false });
      }
      if (!db.objectStoreNames.contains(BLOBS_STORE_NAME)) {
        const blobs = db.createObjectStore(BLOBS_STORE_NAME, { keyPath: "blobId" });
        blobs.createIndex("opId", "opId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueOperation(op: OfflineOperation): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(op);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listOperations(): Promise<OfflineOperation[]> {
  const db = await openDb();
  const rows = await new Promise<OfflineOperation[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve((req.result || []) as OfflineOperation[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows.sort((a, b) => a.clientTimestamp.localeCompare(b.clientTimestamp));
}

export async function removeOperations(opIds: string[]): Promise<void> {
  if (!opIds.length) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const id of opIds) store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(BLOBS_STORE_NAME, "readwrite");
    const store = tx.objectStore(BLOBS_STORE_NAME);
    const index = store.index("opId");
    for (const id of opIds) {
      const req = index.getAllKeys(id);
      req.onsuccess = () => {
        const keys = (req.result || []) as IDBValidKey[];
        for (const key of keys) store.delete(key);
      };
      req.onerror = () => reject(req.error);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function clearOperations(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(BLOBS_STORE_NAME, "readwrite");
    tx.objectStore(BLOBS_STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function putOperationBlob(input: {
  blobId: string;
  opId: string;
  fieldName: string;
  fileName: string;
  contentType: string;
  blob: Blob;
}): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(BLOBS_STORE_NAME, "readwrite");
    tx.objectStore(BLOBS_STORE_NAME).put(input);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listOperationBlobs(opId: string): Promise<Array<{
  blobId: string;
  opId: string;
  fieldName: string;
  fileName: string;
  contentType: string;
  blob: Blob;
}>> {
  const db = await openDb();
  const rows = await new Promise<Array<{
    blobId: string;
    opId: string;
    fieldName: string;
    fileName: string;
    contentType: string;
    blob: Blob;
  }>>((resolve, reject) => {
    const tx = db.transaction(BLOBS_STORE_NAME, "readonly");
    const req = tx.objectStore(BLOBS_STORE_NAME).index("opId").getAll(opId);
    req.onsuccess = () => resolve((req.result || []) as any[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows;
}
