"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etcd3_1 = require("etcd3");
const etcdClient = new etcd3_1.Etcd3({
    grpcOptions: {
        "grpc-node.max_session_memory": 100000000,
    },
    hosts: ["localhost:2379"],
});
exports.default = etcdClient;
//# sourceMappingURL=client.js.map