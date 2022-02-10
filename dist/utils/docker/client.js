"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dockerode_1 = __importDefault(require("dockerode"));
const dockerClient = new dockerode_1.default({ socketPath: "/var/run/docker.sock" });
exports.default = dockerClient;
//# sourceMappingURL=client.js.map