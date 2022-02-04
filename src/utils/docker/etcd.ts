import dockerClient from "./client";

import { stdout } from "process";

const docker = dockerClient;

const createAndStartEtcdContainer = () => {
  console.log("Successfully pulled image");
  console.log("Creating container...");
  docker.createContainer(
    {
      Image: "nginx",
    },
    (err, container) => {
      if (!err) {
        console.log("Created container ID: ", container?.id);
        container?.start({}, (err) => {
          if (!err) {
            console.log(`Started container ${container?.id}`);
          } else {
            console.log(err);
          }
        });
      } else {
        console.log(err);
      }
    }
  );
};

const etcdContainer = () => {
  docker.pull("nginx", {}, (err, stream) => {
    if (!err) {
      console.log("Pulling image...");
      stream.pipe(stdout);
      // follow pull progress, then create container on pull finished
      docker.modem.followProgress(stream, createAndStartEtcdContainer);
    } else {
      console.log(err);
    }
  });
};

// etcdContainer();

export default etcdContainer;
