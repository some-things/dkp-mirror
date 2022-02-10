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
const sleep_1 = __importDefault(require("../sleep"));
const client_1 = __importDefault(require("./client"));
const constants_1 = require("../../constants");
const path_1 = require("path");
const directories_1 = require("../directories");
const getServiceSubnet_1 = __importDefault(require("../cluster/getServiceSubnet"));
const docker = client_1.default;
const apiServerContainer = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Pulling apiserver image");
    const pullStream = yield docker.pull(constants_1.APISERVER_IMAGE);
    console.log("Waiting for apiserver image pull to complete");
    yield new Promise((res) => docker.modem.followProgress(pullStream, res));
    console.log("Successfully pulled apiserver image");
    const serviceSubnet = yield (0, getServiceSubnet_1.default)();
    console.log("Creating apiserver container");
    const container = yield docker.createContainer({
        name: "dkp-mirror-kube-apiserver",
        Hostname: "dkp-mirror-kube-apiserver",
        Cmd: [
            "kube-apiserver",
            "--etcd-servers=http://dkp-mirror-etcd:2379",
            "--authorization-mode=Node,RBAC",
            "--disable-admission-plugins=MutatingAdmissionWebhook,ValidatingAdmissionWebhook,ImagePolicyWebhook,MutatingAdmissionWebhook,ValidatingAdmissionWebhook",
            "--token-auth-file=/tokens.txt",
            "--service-account-issuer=https://kubernetes.default.svc.cluster.local",
            "--service-account-key-file=/var/run/kubernetes/apiserver.key",
            "--service-account-signing-key-file=/var/run/kubernetes/apiserver.key",
            "--event-ttl=8760h",
            typeof serviceSubnet === "string"
                ? `--service-cluster-ip-range=${serviceSubnet}`
                : "",
        ],
        WorkingDir: "/",
        ExposedPorts: {
            "6443/tcp": {},
        },
        HostConfig: {
            Binds: [
                `${(0, path_1.join)(directories_1.currentWorkingDir, constants_1.ARTIFACTS_DIR_NAME, constants_1.APISERVER_TOKEN_FILE_NAME)}:/tokens.txt`,
            ],
            NetworkMode: "dkp-mirror-network",
            PortBindings: {
                "6443/tcp": [
                    {
                        HostIp: "",
                        HostPort: "6443",
                    },
                ],
            },
        },
        Image: constants_1.APISERVER_IMAGE,
    });
    console.log("Successfully created apiserver container");
    console.log("Starting apiserver container");
    yield container.start();
    console.log("Successfully started apiserver container");
    yield (0, sleep_1.default)(3000);
    return container;
});
exports.default = apiServerContainer;
//# sourceMappingURL=apiServer.js.map