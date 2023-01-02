import Dockerode from 'dockerode';
import { join } from 'path';

import { APISERVER_IMAGE, APISERVER_TOKEN_FILE_NAME, ARTIFACTS_DIR_NAME } from '../../constants';
import getServiceSubnet from '../cluster/getServiceSubnet';
import { currentWorkingDir } from '../directories';
import sleep from '../sleep';
import dockerClient from './client';

const docker = dockerClient;

const apiServerContainer = async (): Promise<Dockerode.Container> => {
  console.log("Pulling apiserver image");
  const pullStream = await docker.pull(APISERVER_IMAGE);

  console.log("Waiting for apiserver image pull to complete");
  await new Promise((res) =>
    docker.modem.followProgress(pullStream, res, (event) => {
      const { status, progress } = event;
      console.log(`${status} ${progress || ""}`);
    })
  );
  console.log("Successfully pulled apiserver image");

  console.log("Getting service subnet from config");
  const serviceSubnet: string | undefined = await getServiceSubnet();
  console.log(
    typeof serviceSubnet === "string"
      ? `Service subnet: ${serviceSubnet}`
      : `Could not determine service subnet`
  );

  console.log("Creating apiserver container");
  const container = await docker.createContainer({
    name: "dkp-mirror-kube-apiserver",
    Hostname: "dkp-mirror-kube-apiserver",
    Cmd: [
      "kube-apiserver",
      "--etcd-servers=http://dkp-mirror-etcd:2379",
      "--authorization-mode=Node,RBAC",
      "--disable-admission-plugins=MutatingAdmissionWebhook,ValidatingAdmissionWebhook,ImagePolicyWebhook,MutatingAdmissionWebhook,ValidatingAdmissionWebhook",
      "--token-auth-file=/tokens.txt",
      // since these 3 SA flags are required, we just pass random and non-functional values
      "--service-account-issuer=https://kubernetes.default.svc.cluster.local",
      "--service-account-key-file=/var/run/kubernetes/apiserver.key",
      "--service-account-signing-key-file=/var/run/kubernetes/apiserver.key",
      "--event-ttl=8760h",
      typeof serviceSubnet === "string"
        ? `--service-cluster-ip-range=${serviceSubnet}`
        : "",
      // typeof podSubnet === "string" ? `--pod-cidr=${podSubnet}` : "",
    ],
    WorkingDir: "/",
    ExposedPorts: {
      "6443/tcp": {},
    },
    HostConfig: {
      Binds: [
        `${join(
          currentWorkingDir,
          ARTIFACTS_DIR_NAME,
          APISERVER_TOKEN_FILE_NAME
        )}:/tokens.txt`,
      ],
      // AutoRemove: true,
      // RestartPolicy: {
      //   Name: "no",
      //   MaximumRetryCount: 0,
      // },
      NetworkMode: "dkp-mirror-network",
      PortBindings: {
        "6443/tcp": [
          {
            HostIp: "",
            HostPort: "6443",
          },
        ],
      },
    },
    Image: APISERVER_IMAGE,
  });
  console.log("Successfully created apiserver container");

  console.log("Starting apiserver container");
  try {
    await container.start();
  } catch (e) {
    console.log("Failed to start apiserver container");
    console.error(e);
    process.exit(1);
  }

  console.log("Successfully started apiserver container");

  console.log("Waiting for apiserver container to be in running state");
  for (let i = 0; i < 10; i++) {
    try {
      await sleep(3000);
      const state = await container.inspect();
      if (state.State.Running) {
        break;
      } else {
        console.log(
          `Waited ${(i + 1) * 3} of 30 seconds for apiserver container to start`
        );
        throw new Error("apiserver container not in a running state");
      }
    } catch (e) {
      if (i === 9) {
        console.log(
          "Failed to start apiserver container after waiting 30 seconds"
        );
        console.error(e);
        process.exit(1);
      }
    }
  }

  return container;
};

export default apiServerContainer;
