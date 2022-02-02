import dockerClient from "./client";

import { stdout } from "process";

const docker = dockerClient;

const pullEtcdImage = async () => {
  await docker.pull("redis", function (err: any, stream: any) {
    if (err) {
      return console.error(err);
    }
    stream.pipe(stdout);
  });
};

const runEtcdContainer = async () => {
  //run and give a container a name and a label
  docker.run(
    "redis",
    [],
    stdout,
    {
      name: "MyNamedContainer",
      Labels: {
        environment: "blueWhale",
      },
      HostConfig: {
        PortBindings: {
          "6379/tcp": [
            {
              HostPort: "6379", //Map container to a random unused port.
            },
          ],
        },
      },
    },
    function (err: any, data: any, container: any) {
      if (err) {
        return console.error(err);
      }
      console.log(data.StatusCode);
      console.log(container);
    }
  );
};

// !Need to figure out why this does not pull the image first
// maybe this? https://github.com/apocas/dockerode/issues/357
const etcdContainer = () => {
  pullEtcdImage();
  runEtcdContainer();
};

etcdContainer();

export default etcdContainer;
