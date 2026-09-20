// tg_import.js（书签调用版）
async function startImport(data) {
    try {
        // 1. localStorage
        Object.entries(data.localStorage || {}).forEach(([k, v]) =>
            localStorage.setItem(k, v)
        );

        // 2. IndexedDB
        for (const dbName in data.indexedDB || {}) {
            const dbInfo = data.indexedDB[dbName];
            await new Promise(resolve => {
                const req = indexedDB.open(dbName, dbInfo.version || 1);
                req.onupgradeneeded = e => {
                    const db = e.target.result;
                    Object.keys(dbInfo.stores || {}).forEach(store => {
                        if (!db.objectStoreNames.contains(store)) {
                            db.createObjectStore(store);
                        }
                    });
                };
                req.onsuccess = e => {
                    const db = e.target.result;
                    const storeNames = Object.keys(dbInfo.stores || {});
                    const tx = db.transaction(storeNames, 'readwrite');
                    storeNames.forEach(storeName => {
                        const store = tx.objectStore(storeName);
                        (dbInfo.stores[storeName] || []).forEach(item => {
                            // 导出时的格式是 {key, value}
                            if (item && item.key !== undefined) {
                                store.put(item.value, item.key);
                            } else if (item && item.value !== undefined) {
                                store.put(item.value);
                            }
                        });
                    });
                    tx.oncomplete = () => {
                        db.close();
                        resolve();
                    };
                };
                req.onerror = () => resolve(); // 别卡住
            });
        }

        alert('✅ 导入成功，即将刷新');
        setTimeout(() => location.reload(), 800);
    } catch (e) {
        alert('❌ 导入失败：' + e.message);
    }
}
