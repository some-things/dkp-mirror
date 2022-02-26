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
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const tar_1 = require("tar");
const extract = (bundleFile, outputDir, ticketId) => __awaiter(void 0, void 0, void 0, function* () {
    const extractOutputDir = ticketId
        ? (0, path_1.resolve)((0, path_1.join)(outputDir, ticketId))
        : (0, path_1.resolve)(outputDir);
    const resolvedBundleFile = (0, path_1.resolve)(bundleFile);
    if ((0, fs_1.existsSync)(extractOutputDir) === false) {
        console.log("Output dir does not exist, creating it");
        yield (0, promises_1.mkdir)(extractOutputDir, { recursive: true });
        console.log(`Output dir created: ${extractOutputDir}`);
    }
    console.log(`Extracting ${resolvedBundleFile} to ${(0, path_1.join)(extractOutputDir, (0, path_1.parse)((0, path_1.parse)(bundleFile).name).name)}`);
    yield (0, tar_1.x)({
        file: resolvedBundleFile,
        cwd: extractOutputDir,
    });
    console.log(`Successfully extracted ${resolvedBundleFile} to ${(0, path_1.join)(extractOutputDir, (0, path_1.parse)((0, path_1.parse)(bundleFile).name).name)}`);
});
exports.default = extract;
//# sourceMappingURL=extract.js.map