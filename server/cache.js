const fs = require("fs");

class CacheController {
    constructor(file) {
        this.file = file;
        this.options = {
            defaultTTL: 1,
            clearInterval: 3,
            maxCacheSize: 10
        }
    }

    set(key,value,ttl = this.options.defaultTTL) {
        let temp_obj = {};
        let data = JSON.parse(fs.readFileSync(this.file));
        temp_obj[key] = {
            ...value,
            ttl: ttl*60*1000,
            createdAt: new Date()
        };
        data = {...data,...temp_obj};
        fs.writeFileSync(this.file,JSON.stringify(data));
    }

    get(key) {
        let data = JSON.parse(fs.readFileSync(this.file));
        return data[key];
    }

    remove(key) {
        let data = JSON.parse(fs.readFileSync(this.file));
        delete data[key];
        fs.writeFileSync(this.file,JSON.stringify(data));
    }

    clear() {
        fs.writeFileSync(this.file,JSON.stringify({}));
    }

    checkIfExpired(key) {
        let data = JSON.parse(fs.readFileSync(this.file))
        return Date.now() - new Date(data[key].createdAt) > data[key].ttl;
    }

    checkSize() {
        let size = (fs.statSync(this.file).size / (1024*1024));
        if(size >= this.options.maxCacheSize) {
            this.clear();
        }
    }

    clearExpired() {
        let data = JSON.parse(fs.readFileSync(this.file))
        for(let [key,value] of Object.entries(data)){
            if(this.checkIfExpired(key)) {
                delete data[key];
            }
        }
        fs.writeFileSync(this.file,JSON.stringify(data));
    }

    startClearing() {
        this.interval = setInterval(() => {
            this.clearExpired();
        }, this.options.clearInterval * 60 * 1000);
    }

    stopClearing() {
        clearInterval(this.interval);
    }

}

module.exports = new CacheController("cache.json");