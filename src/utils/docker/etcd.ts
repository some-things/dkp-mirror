import { Container } from 'dockerode';

import { ETCD_IMAGE } from '../../constants';
import sleep from '../sleep';
import dockerClient from './client';

const docker = dockerClient;

const etcdContainer = async (): Promise<Container> => {
  console.log("Pulling etcd image");
  const pullStream = await docker.pull(ETCD_IMAGE);

  console.log("Waiting for etcd image pull to complete");
  await new Promise((res) =>
    docker.modem.followProgress(pullStream, res, (event) => {
      const { status, progress } = event;
      console.log(`${status} ${progress || ""}`);
    })
  );
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
  try {
    await container.start();
  } catch (e) {
    console.log("Failed to start etcd container");
    console.error(e);
    process.exit(1);
  }
  console.log("Successfully started etcd container");

  console.log("Waiting for etcd container to be in running state");
  for (let i = 0; i < 10; i++) {
    try {
      await sleep(3000);
      const state = await container.inspect();
      if (state.State.Running) {
        break;
      } else {
        console.log(
          `Waited ${(i + 1) * 3} of 30 seconds for etcd container to start`
        );
        throw new Error("etcd container not in a running state");
      }
    } catch (e) {
      if (i === 9) {
        console.log("Failed to start etcd container after waiting 30 seconds");
        console.error(e);
        process.exit(1);
      }
    }
  }

  return container;
};

export default etcdContainer;
