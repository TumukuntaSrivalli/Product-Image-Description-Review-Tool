// IndexedDB persistent storage for VarnX products & high-resolution uploaded images
const DB_NAME = 'VarnX_Storage';
const STORE_NAME = 'products';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'product_id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save products to local IndexedDB
 */
export async function saveProductsToIndexedDB(products, userEmail = '') {
  if (!Array.isArray(products) || products.length === 0) return;
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const p of products) {
      if (p && p.product_id) {
        store.put({
          ...p,
          user_email: userEmail || p.user_email || 'default',
          saved_at: Date.now(),
        });
      }
    }
  } catch (err) {
    console.warn('Failed to save to IndexedDB:', err);
  }
}

/**
 * Retrieve products from local IndexedDB
 */
export async function getProductsFromIndexedDB(userEmail = '') {
  try {
    const db = await openDB();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        if (!userEmail) {
          resolve(all);
        } else {
          const userSpecific = all.filter(
            (p) => !p.user_email || p.user_email === userEmail || p.user_email === 'default'
          );
          resolve(userSpecific.length > 0 ? userSpecific : all);
        }
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Delete a single product from IndexedDB
 */
export async function deleteProductFromIndexedDB(productId) {
  if (!productId) return;
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(productId);
  } catch (err) {
    console.warn('Failed to delete from IndexedDB:', err);
  }
}

/**
 * Clear all products from IndexedDB
 */
export async function clearProductsFromIndexedDB() {
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (err) {
    console.warn('Failed to clear IndexedDB:', err);
  }
}
