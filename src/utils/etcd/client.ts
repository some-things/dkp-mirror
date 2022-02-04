import { Etcd3 } from "etcd3";

const etcdClient = new Etcd3({
  hosts: ["localhost:2379"],
});

export default etcdClient;
