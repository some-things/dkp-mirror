import { existsSync } from "fs";
import { rm } from "fs/promises";
import { ARTIFACTS_DIR_NAME } from "../constants";
import dockerClient from "../utils/docker/client";

const down = async () => {
  const docker = dockerClient;

  const containerList = await docker.listContainers({
    all: true,
  });
  containerList.forEach(async (c) => {
    if (c.Names[0].includes("dkp-mirror-")) {
      console.log(`Removing container ${c.Names[0]}`);
      await docker.getContainer(c.Id).remove({ force: true });
    }
  });

  if (existsSync(ARTIFACTS_DIR_NAME)) {
    console.log("Removing artifacts directory");
    await rm(ARTIFACTS_DIR_NAME, { recursive: true });
  }

  console.log("Successfully shutdown DKP mirror!");
};

export default down;
