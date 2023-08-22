
class LS {
    constructor() {
        if(!localStorage.getItem("data")) {
            localStorage.setItem("data",JSON.stringify({}));
        }
    }

    set(key,value) {
        let currentData = JSON.parse(localStorage.getItem("data"))
        localStorage.setItem("data", JSON.stringify({...currentData, [key]: value}))
    }

    get(key) {
        let data = JSON.parse(localStorage.getItem("data"))[`${key}`]
        return data;
    }  

    clear() {
        localStorage.setItem("data",JSON.stringify({}));
    }
}

export const LSController = new LS();