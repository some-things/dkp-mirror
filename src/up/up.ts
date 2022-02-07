import fs from "fs";
import path from "path";
import dockerNetwork from "../utils/docker/network";
// import sleep from "../utils/sleep";
import etcdContainer from "../utils/docker/etcd";
import etcdClient from "../utils/etcd/client";
// import apiServerContainer from "../utils/docker/apiServer";

// TODO: make dynamic
const bundleRootDir = "./support-bundle-2022-01-25T19_20_12";
const clusterResourcesDir = path.join(bundleRootDir, "cluster-resources");
const configmapsDir = path.join(bundleRootDir, "configmaps");

const parseResourceFiles = () => {
  console.log("Bundle root dir: ", bundleRootDir);
  console.log("Cluster resources dir: ", clusterResourcesDir);
  // !NOTE: Configmaps dir seems somewhat useless
  console.log("Configmaps dir: ", configmapsDir);

  const clusterResourceDirFilesToParse: string[] = [
    "nodes.json",
    "namespaces.json",
  ];

  const resourceFiles = fs.readdirSync(bundleRootDir, { withFileTypes: true });
  resourceFiles.forEach((f) => {
    // console.log(
    //   `File name: ${f.name} --- File type: ${
    //     f.isDirectory() ? "directory" : "file"
    //   }`
    // );

    // console.log(path.join(bundleRootDir, f.name));
    // console.log(path.join(bundleRootDir, clusterResourcesDir));

    if (
      f.isDirectory() &&
      path.join(bundleRootDir, f.name) === clusterResourcesDir
    ) {
      const clusterResourcesDirFiles = fs.readdirSync(
        path.join(bundleRootDir, f.name),
        { withFileTypes: true }
      );
      clusterResourcesDirFiles.forEach((f) => {
        if (clusterResourceDirFilesToParse.includes(f.name)) {
          console.log(
            `File name: ${f.name} --- File type: ${
              f.isDirectory() ? "directory" : "file"
            }`
          );

          // For each file in the cluster resources dir, parse it
          const resourceFile = fs.readFileSync(
            path.join(clusterResourcesDir, f.name),
            "utf8"
          );

          const jsonObjects = JSON.parse(resourceFile);
          // For each json object in the file
          for (let i = 0; i < jsonObjects.length; i++) {
            console.log(jsonObjects[i]["metadata"]["name"]);
          }
        }
      });
    }

    // const resourceFile = fs.readFileSync(
    //   path.join(bundleRootDir, f),
    //   "utf8"
    // );
    // console.log(resourceFile);
  });
};

const up = async () => {
  parseResourceFiles();
  await dockerNetwork();
  await etcdContainer();

  try {
    await etcdClient.put("foo").value("bar");

    const fooValue = await etcdClient.get("foo").string();
    console.log("foo was:", fooValue);

    const allFValues = await etcdClient.getAll().prefix("f").keys();
    console.log('all our keys starting with "f":', allFValues);

    await etcdClient.delete().all();
  } catch (error) {
    console.log(error);
  }

  // await apiServerContainer();
};

export default up;
