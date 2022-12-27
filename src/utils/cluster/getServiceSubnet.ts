import { existsSync } from 'fs';
import path from 'path';

import { getClusterResourcesDir } from '../directories';
import { resourceFileToJSON } from '../resourceFileToJSON';
import getClusterConfiguration from './getClusterConfiguration';

// @ts-ignore
const getKubeadmServiceSubnet = async () => {
  const clusterConfiguration = await getClusterConfiguration();

  const serviceSubnet = clusterConfiguration.networking.serviceSubnet;

  return typeof serviceSubnet === "undefined" ? undefined : serviceSubnet;
};

// we instead read from apiserver flags, as this seems to be the most reliable when accounting for non-kubeadm clusters
const getServiceSubnet = () => {
  const kubeSystemPodsJSONFilePath = path.join(
    getClusterResourcesDir(),
    "pods/kube-system.json"
  );
  const kubeSystemPodsYAMLFilePath = path.join(
    getClusterResourcesDir(),
    "pods/kube-system.yaml"
  );

  if (
    !existsSync(kubeSystemPodsJSONFilePath) &&
    !existsSync(kubeSystemPodsYAMLFilePath)
  ) {
    return;
  }

  const kubeSystemPods =
    resourceFileToJSON(kubeSystemPodsJSONFilePath) ||
    resourceFileToJSON(kubeSystemPodsYAMLFilePath);

  // we only check the first apiserver pod, as we assume all apiserver pods have the same service subnet
  // todo: we assume all apiserver pods have label component=kube-apiserver -- test this assumption (e.g., different distros)
  const apiServerPod: any = kubeSystemPods.find(
    (pod: any) => pod.metadata.labels.component === "kube-apiserver"
  );

  const serviceSubnet = apiServerPod.spec.containers.find((container: any) => {
    return container.command.find((command: any) => {
      return command.includes("--service-cluster-ip-range=");
    });
  })
    ? apiServerPod.spec.containers
        .find((container: any) => {
          return container.command.find((command: any) => {
            return command.includes("--service-cluster-ip-range=");
          });
        })
        .command.find((command: any) =>
          command.includes("--service-cluster-ip-range=")
        )
        .split("=")[1]
    : undefined;

  return serviceSubnet;
};

export default getServiceSubnet;
