"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const constants_1 = require("../constants");
const client_1 = __importDefault(require("../utils/docker/client"));
const down = () => __awaiter(void 0, void 0, void 0, function* () {
    const docker = client_1.default;
    const containerList = yield docker.listContainers({
        all: true,
    });
    containerList.forEach((c) => __awaiter(void 0, void 0, void 0, function* () {
        if (c.Names[0].includes("dkp-mirror-")) {
            console.log(`Removing container ${c.Names[0]}`);
            yield docker.getContainer(c.Id).remove({ force: true });
        }
    }));
    if ((0, fs_1.existsSync)(constants_1.ARTIFACTS_DIR_NAME)) {
        console.log("Removing artifacts directory");
        yield (0, promises_1.rm)(constants_1.ARTIFACTS_DIR_NAME, { recursive: true });
    }
    console.log("Successfully shutdown DKP mirror!");
});
exports.default = down;
//# sourceMappingURL=down.js.map