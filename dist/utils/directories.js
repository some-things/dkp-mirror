"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultExtractBundleDirectory = exports.customResourcesDir = exports.configmapsDir = exports.clusterResourcesDir = exports.bundleRootDir = exports.currentWorkingDir = exports.homeDir = void 0;
const os_1 = require("os");
const path_1 = require("path");
exports.homeDir = (0, os_1.homedir)();
exports.currentWorkingDir = process.cwd();
exports.bundleRootDir = process.env.DKP_MIRROR_BUNDLE_ROOT_DIR
    ? process.env.DKP_MIRROR_BUNDLE_ROOT_DIR
    : exports.currentWorkingDir;
exports.clusterResourcesDir = (0, path_1.join)(exports.bundleRootDir, "cluster-resources");
exports.configmapsDir = (0, path_1.join)(exports.bundleRootDir, "configmaps");
exports.customResourcesDir = (0, path_1.join)(exports.bundleRootDir, "cluster-resources/custom-resources");
exports.defaultExtractBundleDirectory = (0, path_1.join)(exports.homeDir, "Documents/logs/tickets");
//# sourceMappingURL=directories.js.map