import { Policy } from 'cockatiel';
import { Etcd3 } from 'etcd3';

const globalPolicy = Policy.handleAll()
  .retry()
  .attempts(5)
  .exponential({ initialDelay: 1000, maxDelay: 10000 });

globalPolicy.onFailure((err) => {
  console.log(`Failed to connect to etcd: ${err}`);
  return;
});

globalPolicy.onRetry((err) => {
  console.log(`Retrying to connect to etcd: ${err}`);
  return;
});

globalPolicy.onSuccess((data) => {
  console.log("Successfully connected to etcd:", data);
  return;
});

const etcdClient = new Etcd3({
  grpcOptions: {
    // https://github.com/grpc/grpc-node/issues/1158
    // TODO: set this to a more appropriate value
    "grpc-node.max_session_memory": 100000000,
    "grpc.enable_retries": 5,
    "grpc.max_concurrent_streams": 100000000,
    "grpc.max_send_message_length": 100000000,
    "grpc.max_receive_message_length": 100000000,
  },
  hosts: ["localhost:2379"],
  faultHandling: {
    global: globalPolicy,
  },
});

export default etcdClient;
