import dockerClient from "../utils/docker/client";

const down = async () => {
  const docker = dockerClient;

  console.log("Stopping and removing containers");

  const kubeApiserverContainer = docker.getContainer(
    "dkp-mirror-kube-apiserver"
  );
  console.log("apiserver container: ", kubeApiserverContainer);
  await kubeApiserverContainer.stop();
  console.log("Removing kube-apiserver container");
  await kubeApiserverContainer.remove();

  const etcdContainer = docker.getContainer("dkp-mirror-etcd");
  console.log("Stopping etcd container");
  await etcdContainer.stop();
  console.log("Removing etcd container");
  await etcdContainer.remove();

  console.log("Successfully shutdown DKP mirror!");
};

export default down;
