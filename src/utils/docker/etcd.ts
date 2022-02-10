import { Container } from "dockerode";
import { ETCD_IMAGE } from "../../constants";
import sleep from "../sleep";
import dockerClient from "./client";

const docker = dockerClient;

const etcdContainer = async (): Promise<Container> => {
  console.log("Pulling etcd image");
  const pullStream = await docker.pull(ETCD_IMAGE);

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
      // AutoRemove: true,
      // RestartPolicy: {
      //   Name: "no",
      //   MaximumRetryCount: 0,
      // },
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
    Image: ETCD_IMAGE,
  });
  console.log("Successfully created etcd container");

  console.log("Starting etcd container");
  await container.start();
  console.log("Successfully started etcd container");

  // TODO: better readiness check for etcd
  await sleep(3000);

  return container;
};

export default etcdContainer;
