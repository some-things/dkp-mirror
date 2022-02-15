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
const path_1 = require("path");
const constants_1 = require("../constants");
const directories_1 = require("../utils/directories");
const apiServer_1 = __importDefault(require("../utils/docker/apiServer"));
const etcd_1 = __importDefault(require("../utils/docker/etcd"));
const network_1 = __importDefault(require("../utils/docker/network"));
const client_1 = __importDefault(require("../utils/etcd/client"));
const defaultClusterResourceFilesToParse = [
    "nodes.json",
    "namespaces.json",
    "custom-resource-definitions.json",
    "storage-classes.json",
    "pvs.json",
];
const defaultNamespacedResourceDirsToParse = [
    "cronjobs",
    "deployments",
    "events",
    "ingress",
    "jobs",
    "limitranges",
    "pods",
    "pvcs",
    "services",
    "statefulsets",
];
const parseClusterResources = () => {
    const clusterResourcesDirFiles = (0, fs_1.readdirSync)(directories_1.clusterResourcesDir, {
        withFileTypes: true,
    });
    clusterResourcesDirFiles.forEach((f) => {
        const fileBasename = (0, path_1.parse)(f.name).name;
        const kind = getKind(fileBasename);
        const apiVersion = getApiVersion(kind);
        const kindPath = getKindPath(fileBasename);
        if (f.isDirectory() &&
            defaultNamespacedResourceDirsToParse.includes(f.name)) {
            const clusterResourcesDirDirs = (0, fs_1.readdirSync)((0, path_1.join)(directories_1.clusterResourcesDir, f.name), { withFileTypes: true });
            clusterResourcesDirDirs.forEach((clusterResourcesDirDirsFile) => {
                if ((0, path_1.extname)(clusterResourcesDirDirsFile.name) === ".json") {
                    const namespace = (0, path_1.parse)(clusterResourcesDirDirsFile.name).name;
                    const resourceFile = (0, fs_1.readFileSync)((0, path_1.join)(directories_1.clusterResourcesDir, f.name, clusterResourcesDirDirsFile.name), "utf8");
                    const jsonObjects = JSON.parse(resourceFile);
                    jsonObjects.forEach((jsonObject) => {
                        const name = jsonObject["metadata"]["name"];
                        jsonObject["metadata"]["namespace"] = namespace;
                        jsonObject["kind"] = kind;
                        jsonObject["apiVersion"] = apiVersion;
                        (() => __awaiter(void 0, void 0, void 0, function* () {
                            yield client_1.default
                                .put(`/registry/${kindPath}${namespace}/${name}`)
                                .value(JSON.stringify(jsonObject));
                        }))();
                    });
                }
            });
        }
        else if (f.isFile() &&
            defaultClusterResourceFilesToParse.includes(f.name) &&
            (0, path_1.extname)(f.name) === ".json") {
            const resourceFile = (0, fs_1.readFileSync)((0, path_1.join)((0, path_1.join)(directories_1.clusterResourcesDir, f.name)), "utf8");
            const jsonObjects = JSON.parse(resourceFile);
            jsonObjects.forEach((jsonObject) => {
                const name = jsonObject["metadata"]["name"];
                jsonObject["kind"] = kind;
                jsonObject["apiVersion"] = apiVersion;
                if (kind == "CustomResourceDefinition") {
                    jsonObject["spec"]["conversion"] = {};
                    jsonObject["spec"]["conversion"]["strategy"] = "None";
                }
                (() => __awaiter(void 0, void 0, void 0, function* () {
                    yield client_1.default
                        .put(`/registry/${kindPath}${name}`)
                        .value(JSON.stringify(jsonObject));
                }))();
            });
        }
    });
};
const parseCustomResources = () => {
    const customResourcesDirFiles = (0, fs_1.readdirSync)(directories_1.customResourcesDir, {
        withFileTypes: true,
    });
    customResourcesDirFiles.forEach((f) => {
        const apiResource = f.name.split(".")[0];
        if (f.isDirectory()) {
            const apiGroup = f.name.split(".").slice(1).join(".");
            const customResourceDirFiles = (0, fs_1.readdirSync)((0, path_1.join)(directories_1.customResourcesDir, f.name), { withFileTypes: true });
            customResourceDirFiles.forEach((customResourceDirFile) => {
                if ((0, path_1.extname)(customResourceDirFile.name) === ".json") {
                    const namespace = (0, path_1.parse)(customResourceDirFile.name).name;
                    const resourceFile = (0, fs_1.readFileSync)((0, path_1.join)(directories_1.customResourcesDir, f.name, customResourceDirFile.name), "utf8");
                    const jsonObjects = JSON.parse(resourceFile);
                    jsonObjects.forEach((jsonObject) => {
                        const name = jsonObject["metadata"]["name"];
                        jsonObject["metadata"]["namespace"] = namespace;
                        (() => __awaiter(void 0, void 0, void 0, function* () {
                            yield client_1.default
                                .put(`/registry/${apiGroup}/${apiResource}/${namespace}/${name}`)
                                .value(JSON.stringify(jsonObject));
                        }))();
                    });
                }
            });
        }
        else if (f.isFile() && (0, path_1.extname)(f.name) === ".json") {
            const apiGroup = f.name.split(".").slice(1, -1).join(".");
            const resourceFile = (0, fs_1.readFileSync)((0, path_1.join)(directories_1.customResourcesDir, f.name), "utf8");
            const jsonObjects = JSON.parse(resourceFile);
            jsonObjects.forEach((jsonObject) => {
                const name = jsonObject["metadata"]["name"];
                (() => __awaiter(void 0, void 0, void 0, function* () {
                    yield client_1.default
                        .put(`/registry/${apiGroup}/${apiResource}/${name}`)
                        .value(JSON.stringify(jsonObject));
                }))();
            });
        }
    });
};
const getKindPath = (filename) => {
    let kindPath;
    switch (filename) {
        case "nodes":
            kindPath = "minions/";
            break;
        case "endpoints":
            kindPath = "services/endpoints/";
            break;
        case "services":
            kindPath = "services/specs/";
            break;
        case "leases":
            kindPath = "leases/kube-node-lease/";
            break;
        case "ingress":
            kindPath = "ingress/";
            break;
        case "podsecuritypolicies":
            kindPath = "podsecuritypolicy/";
            break;
        case "storage-classes":
            kindPath = "storageclasses/";
            break;
        case "namespace":
            kindPath = "namespaces/";
            break;
        case "pvs":
            kindPath = "persistentvolumes/";
            break;
        case "custom-resource-definitions":
            kindPath = "apiextensions.k8s.io/customresourcedefinitions/";
            break;
        case "pvcs":
            kindPath = "persistentvolumeclaims/";
            break;
        default:
            kindPath = `${filename}/`;
            break;
    }
    return kindPath;
};
const getKind = (filename) => {
    let kind;
    switch (filename) {
        case "nodes":
            kind = "Node";
            break;
        case "storage-classes":
            kind = "StorageClass";
            break;
        case "namespaces":
            kind = "Namespace";
            break;
        case "pvs":
            kind = "PersistentVolume";
            break;
        case "custom-resource-definitions":
            kind = "CustomResourceDefinition";
            break;
        case "cronjobs":
            kind = "CronJob";
            break;
        case "deployments":
            kind = "Deployment";
            break;
        case "events":
            kind = "Event";
            break;
        case "ingress":
            kind = "Ingress";
            break;
        case "jobs":
            kind = "Job";
            break;
        case "limitranges":
            kind = "LimitRange";
            break;
        case "pods":
            kind = "Pod";
            break;
        case "pvcs":
            kind = "PersistentVolumeClaim";
            break;
        case "services":
            kind = "Service";
            break;
        case "statefulsets":
            kind = "StatefulSet";
            break;
        default:
            kind = filename;
            break;
    }
    return kind;
};
const getApiVersion = (kind) => {
    const apiResourceFile = (0, fs_1.readFileSync)((0, path_1.join)(directories_1.clusterResourcesDir, "resources.json"), "utf8");
    const apiResourcesJson = JSON.parse(apiResourceFile);
    const apiVersion = (() => {
        for (let i = 0; i < apiResourcesJson.length; i++) {
            const resources = apiResourcesJson[i]["resources"];
            for (let j = 0; j < resources.length; j++) {
                if (resources[j]["kind"] === kind) {
                    return apiResourcesJson[i]["groupVersion"];
                }
            }
        }
    })();
    return apiVersion;
};
const createArtifactsDir = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Creating artifacts directory");
    yield (0, promises_1.mkdir)((0, path_1.join)(directories_1.currentWorkingDir, constants_1.ARTIFACTS_DIR_NAME));
});
const writeApiserverTokenFile = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Writing kube-apiserver token file");
    yield (0, promises_1.writeFile)((0, path_1.join)(directories_1.currentWorkingDir, constants_1.ARTIFACTS_DIR_NAME, constants_1.APISERVER_TOKEN_FILE_NAME), constants_1.APISERVER_TOKEN_FILE_DATA);
});
const writeKubeconfig = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Writing kubeconfig");
    yield (0, promises_1.writeFile)((0, path_1.join)(directories_1.currentWorkingDir, constants_1.ARTIFACTS_DIR_NAME, constants_1.KUBECONFIG_FILE_NAME), constants_1.KUBECONFIG_FILE_DATA);
});
const up = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Starting DKP mirror!");
    yield (0, network_1.default)();
    yield (0, etcd_1.default)();
    parseClusterResources();
    parseCustomResources();
    yield createArtifactsDir();
    yield writeApiserverTokenFile();
    yield (0, apiServer_1.default)();
    yield writeKubeconfig();
    console.log("Successfully started DKP mirror!");
    console.log(`
    To access the DKP mirror, execute:

    export KUBECONFIG=${(0, path_1.join)(directories_1.currentWorkingDir, constants_1.ARTIFACTS_DIR_NAME, constants_1.KUBECONFIG_FILE_NAME)}`);
});
exports.default = up;
//# sourceMappingURL=up.js.map