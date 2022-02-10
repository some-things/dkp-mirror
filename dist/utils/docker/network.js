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
const client_1 = __importDefault(require("./client"));
const docker = client_1.default;
const dockerNetwork = () => __awaiter(void 0, void 0, void 0, function* () {
    const networkList = yield docker.listNetworks({});
    if (networkList.some((network) => network.Name === "dkp-mirror-network")) {
        console.log("dkp-mirror-network network already exists");
    }
    else {
        try {
            const network = yield docker.createNetwork({
                Name: "dkp-mirror-network",
            });
            console.log("Created dkp-mirror-network: ", network.id);
        }
        catch (error) {
            console.error(error);
        }
    }
    return docker.getNetwork("dkp-mirror-network");
});
exports.default = dockerNetwork;
//# sourceMappingURL=network.js.map