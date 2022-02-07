import { Container } from "dockerode";
import sleep from "../sleep";
import dockerClient from "./client";

// import { stdout } from "process";

const docker = dockerClient;

const etcdContainer = async (): Promise<Container> => {
  console.log("Pulling etcd image");
  const pullStream = await docker.pull("k8s.gcr.io/etcd:3.4.13-0");

  console.log("Waiting for etcd image pull to complete");
  await new Promise((res) => docker.modem.followProgress(pullStream, res));
  console.log("Successfully pulled etcd image");

  console.log("Creating etcd container");
  const container = await docker.createContainer({
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
      AutoRemove: true,
      RestartPolicy: {
        Name: "no",
        MaximumRetryCount: 0,
      },
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
    Image: "k8s.gcr.io/etcd:3.4.13-0",
  });
  console.log("Successfully created etcd container");

  console.log("Starting etcd container");
  await container.start();
  console.log("Successfully started etcd container");

  // TODO: Wait for etcd to be ready
  await sleep(3000);

  return container;
};

export default etcdContainer;
