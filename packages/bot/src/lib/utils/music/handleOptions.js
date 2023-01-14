"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inactivityTime = void 0;
const options_json_1 = __importDefault(require("../../../options.json"));
function inactivityTime() {
    let response = 30000; // Default 30 seconds
    if (!options_json_1.default) {
        return response;
    }
    if (!options_json_1.default.inactivityTime) {
        return response;
    }
    const savedOption = Number(options_json_1.default.inactivityTime);
    if (savedOption < 0)
        return response;
    if (Number.isInteger(savedOption)) {
        response = savedOption * 1000;
    }
    response == 0 ? (response = 30000) : null;
    return response;
}
exports.inactivityTime = inactivityTime;
//# sourceMappingURL=handleOptions.js.map