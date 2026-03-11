import { createWorker } from 'tesseract.js';
import fs from 'fs';

(async () => {
    try {
        const worker = await createWorker('por');
        const dir = 'C:/Users/ismae/.gemini/antigravity/brain/5d484a54-6b44-4dcd-ae5d-b59e6a595aba/';
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
        
        for (const file of files) {
            console.log(`\n--- Reading ${file} ---`);
            const ret = await worker.recognize(dir + file);
            console.log(ret.data.text);
        }
        await worker.terminate();
    } catch (e) {
        console.error(e);
    }
})();
