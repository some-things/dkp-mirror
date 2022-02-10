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
const promises_1 = require("fs/promises");
const path_1 = require("path");
const directories_1 = require("../directories");
const yaml_1 = __importDefault(require("yaml"));
const getClusterConfiguration = () => __awaiter(void 0, void 0, void 0, function* () {
    const kubeadmConfigConfigMap = yield (0, promises_1.readFile)((0, path_1.join)(directories_1.configmapsDir, "kube-system/kubeadm-config.json"), "utf-8");
    const kubeadmConfigConfigMapJSON = JSON.parse(kubeadmConfigConfigMap);
    const clusterConfigurationYAML = yaml_1.default.parse(kubeadmConfigConfigMapJSON.data.ClusterConfiguration);
    return typeof clusterConfigurationYAML === "undefined"
        ? undefined
        : clusterConfigurationYAML;
});
exports.default = getClusterConfiguration;
//# sourceMappingURL=getClusterConfiguration.js.map