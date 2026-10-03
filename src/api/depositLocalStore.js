const DATABASE_NAME = "winner-top-payment-demo";
const DATABASE_VERSION = 1;
const MAX_DEPOSIT_OPTIONS = 10;

function openDatabase() {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error("Browser storage is unavailable."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("depositOptions")) {
        database.createObjectStore("depositOptions", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open browser storage."));
  });
}

function readAll(storeName) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    let records = [];
    request.onsuccess = () => { records = request.result || []; };
    transaction.oncomplete = () => {
      database.close();
      resolve(records);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Could not read browser storage."));
    };
  }));
}

function writeRecord(storeName, record) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(record);
    transaction.oncomplete = () => {
      database.close();
      resolve(record);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Could not save browser data."));
    };
  }));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

function newId(prefix) {
  const randomId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomId}`;
}

export function isMissingPaymentApi(error) {
  return error.response?.status === 404;
}

export async function getLocalDepositOptions() {
  return readAll("depositOptions");
}

export async function getLocalActiveDepositOption() {
  const options = await getLocalDepositOptions();
  return options.find((option) => option.isActive) || null;
}

export async function addLocalDepositOption({ displayName, upiId, qrFile }) {
  const options = await getLocalDepositOptions();
  if (options.length >= MAX_DEPOSIT_OPTIONS) {
    throw new Error(`A maximum of ${MAX_DEPOSIT_OPTIONS} deposit options can be stored.`);
  }

  const option = {
    id: newId("local-option"),
    displayName,
    upiId,
    qrCodeUrl: await readFileAsDataUrl(qrFile),
    isActive: false,
    createdAt: new Date().toISOString(),
    storageMode: "local-demo",
  };
  return writeRecord("depositOptions", option);
}

export function setLocalActiveDepositOption(optionId) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction("depositOptions", "readwrite");
    const store = transaction.objectStore("depositOptions");
    const request = store.getAll();
    let activeOption = null;
    request.onsuccess = () => {
      for (const option of request.result || []) {
        option.isActive = option.id === optionId;
        if (option.isActive) activeOption = option;
        store.put(option);
      }
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(activeOption);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Could not activate this deposit option."));
    };
  }));
}

