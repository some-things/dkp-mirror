import { Etcd3 } from 'etcd3'

const etcdClient = new Etcd3({
  grpcOptions: {
    // https://github.com/grpc/grpc-node/issues/1158
    // TODO: set this to a more appropriate value
    "grpc-node.max_session_memory": 100000000,
  },
  hosts: ["localhost:2379"],
});

export default etcdClient;
