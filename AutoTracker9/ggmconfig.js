// wheelConfig.js

export let wheelConfig = [];

export function addNode(value, count) {
    for (let i = 0; i < count; i++) {
        wheelConfig.push(value);
    }
    return wheelConfig;
}

export function removeNode(value) {
    wheelConfig = wheelConfig.filter(node => node !== value);
    return wheelConfig;
}

export function editNode(oldValue, newValue, newCount) {
    removeNode(oldValue);
    addNode(newValue, newCount);
    return wheelConfig;
}

export function getConfig() {
    return [...wheelConfig];
}

export function resetConfig() {
    wheelConfig = [];
}
