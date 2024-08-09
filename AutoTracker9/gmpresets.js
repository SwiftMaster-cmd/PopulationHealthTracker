// presets.js

import { wheelConfig, resetConfig, addNode } from './wheelConfig.js';

export const presets = {};

export function savePreset(name) {
    if (name in presets) {
        if (!confirm(`Preset "${name}" already exists. Do you want to overwrite it?`)) {
            return false;
        }
    }
    presets[name] = [...wheelConfig];
    return true;
}

export function loadPreset(name) {
    if (presets[name]) {
        resetConfig();
        presets[name].forEach(value => addNode(value, 1));
        return true;
    }
    return false;
}

export function deletePreset(name) {
    if (name in presets) {
        delete presets[name];
        return true;
    }
    return false;
}

export function getPresets() {
    return Object.keys(presets);
}

export function loadAllPresets() {
    return { ...presets };
}
