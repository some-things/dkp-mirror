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
const constants_1 = require("../../constants");
const sleep_1 = __importDefault(require("../sleep"));
const client_1 = __importDefault(require("./client"));
const docker = client_1.default;
const etcdContainer = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Pulling etcd image");
    const pullStream = yield docker.pull(constants_1.ETCD_IMAGE);
    console.log("Waiting for etcd image pull to complete");
    yield new Promise((res) => docker.modem.followProgress(pullStream, res));
    console.log("Successfully pulled etcd image");
    console.log("Creating etcd container");
    const container = yield docker.createContainer({
        name: "dkp-mirror-etcd",
        Hostname: "dkp-mirror-etcd",
        Cmd: [
            "etcd",
            "-advertise-client-urls",
            "http://dkp-mirror-etcd:2379",
            "-listen-client-urls",
            "http://0.0.0.0:2379",
        ],
        ExposedPorts: {
            "2379/tcp": {},
            "2380/tcp": {},
            "4001/tcp": {},
            "7001/tcp": {},
        },
        HostConfig: {
            NetworkMode: "dkp-mirror-network",
            PortBindings: {
                "2379/tcp": [
                    {
                        HostIp: "",
                        HostPort: "2379",
                    },
                ],
            },
        },
        Image: constants_1.ETCD_IMAGE,
    });
    console.log("Successfully created etcd container");
    console.log("Starting etcd container");
    yield container.start();
    console.log("Successfully started etcd container");
    yield (0, sleep_1.default)(3000);
    return container;
});
exports.default = etcdContainer;
//# sourceMappingURL=etcd.js.map