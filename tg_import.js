(async function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async function () {
        try {
            const text = await this.files[0].text();
            const data = JSON.parse(text);

            Object.entries(data.localStorage || {}).forEach(([k, v]) =>
                localStorage.setItem(k, v)
            );

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
                                if (item.key !== undefined) {
                                    store.put(item.value, item.key);
                                } else {
                                    store.put(item.value);
                                }
                            });
                        });
                        tx.oncomplete = () => {
                            db.close();
                            resolve();
                        };
                    };
                });
            }
            alert('✅ 导入成功，即将刷新');
            setTimeout(() => location.reload(), 1000);
        } catch (e) {
            alert('❌ 导入失败：' + e.message);
        }
    };
    input.click();
})();