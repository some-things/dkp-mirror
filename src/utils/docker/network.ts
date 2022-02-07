import { Network } from "dockerode";
import dockerClient from "./client";

const docker = dockerClient;

const dockerNetwork = async (): Promise<Network> => {
  const networkList = await docker.listNetworks({});
  // console.log("Network list:");
  // networkList.forEach((network, index) => {
  //   console.log(`${index}: ${network.Name}`);
  // });

  if (networkList.some((network) => network.Name === "dkp-mirror-network")) {
    console.log("dkp-mirror-network network already exists");
  } else {
    try {
      const network = await docker.createNetwork({
        Name: "dkp-mirror-network",
      });
      console.log("Created dkp-mirror-network: ", network.id);
    } catch (error) {
      console.error(error);
    }
  }

  return docker.getNetwork("dkp-mirror-network");
};

export default dockerNetwork;
