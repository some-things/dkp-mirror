import sleep from "../sleep";
import dockerClient from "./client";
import { apiServerImage } from "../../constants";

const docker = dockerClient;

const apiServerContainer = async () => {
  console.log("Pulling apiserver image");
  const pullStream = await docker.pull(apiServerImage);

  console.log("Waiting for apiserver image pull to complete");
  await new Promise((res) => docker.modem.followProgress(pullStream, res));
  console.log("Successfully pulled apiserver image");

  const podCIDR: string | undefined = undefined;
  const serviceCIDR: string | undefined = undefined;

  console.log("Creating apiserver container");
  const container = await docker.createContainer({
    name: "dkp-mirror-kube-apiserver",
    Hostname: "dkp-mirror-kube-apiserver",
    // TODO: set service cidr from bundle
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
      typeof podCIDR === "string" ? `--pod-cidr=${podCIDR}` : "",
      typeof serviceCIDR === "string"
        ? `--service-cluster-ip-range=${serviceCIDR}`
        : "",
    ],
    WorkingDir: "/",
    ExposedPorts: {
      "6443/tcp": {},
    },
    HostConfig: {
      Binds: ["/Users/dn/Documents/dkp-mirror/scratch/tokens.txt:/tokens.txt"],
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
    Image: apiServerImage,
  });

  console.log("Successfully created apiserver container");

  console.log("Starting apiserver container");
  await container.start();
  console.log("Successfully started apiserver container");

  // TODO: better readiness check for apiserver
  await sleep(3000);

  return container;
};

export default apiServerContainer;
