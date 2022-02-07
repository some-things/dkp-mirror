import fs from "fs";
import path from "path";
import dockerNetwork from "../utils/docker/network";
import etcdContainer from "../utils/docker/etcd";
import etcdClient from "../utils/etcd/client";
import apiServerContainer from "../utils/docker/apiServer";

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
    "custom-resource-definitions.json",
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
          const fileBasename = path.parse(f.name).name;
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

          const kind = getKind(fileBasename);
          const apiVersion = getApiVersion(kind);
          const kindPath = getKindPath(fileBasename);

          const jsonObjects = JSON.parse(resourceFile);
          // For each json object in the file
          for (let i = 0; i < jsonObjects.length; i++) {
            console.log("Kind: ", kind);
            console.log("apiVersion: ", apiVersion);

            // append kind and apiVersion to the json object
            jsonObjects[i]["kind"] = kind;
            jsonObjects[i]["apiVersion"] = apiVersion;

            console.log(
              `etcdctl put /registry/${kindPath}${jsonObjects[i]["metadata"]["name"]} ${jsonObjects[i]}`
            );

            (async () => {
              await etcdClient
                .put(
                  `/registry/${kindPath}${jsonObjects[i]["metadata"]["name"]}`
                )
                .value(JSON.stringify(jsonObjects[i]));
            })();
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

const getKindPath = (filename: string): string => {
  let kindPath: string;

  switch (filename) {
    case "nodes":
      kindPath = "minions/";
      break;
    case "endpoints":
      kindPath = "services/endpoints/";
      break;
    case "services":
      kindPath = "services/specs/";
      break;
    case "leases":
      kindPath = "leases/kube-node-lease/";
      break;
    case "ingresses":
      kindPath = "ingress/";
      break;
    case "podsecuritypolicies":
      kindPath = "podsecuritypolicy/";
      break;
    case "storageclass":
      kindPath = "storageclasses/";
      break;
    case "namespace":
      kindPath = "namespaces/";
      break;
    case "persistentvolume":
      kindPath = "persistentvolumes/";
      break;
    case "custom-resource-definitions":
      kindPath = "apiextensions.k8s.io/customresourcedefinitions/";
      break;
    default:
      kindPath = `${filename}/`;
      break;
  }

  return kindPath;
};

const getKind = (filename: string): string => {
  let kind: string;

  switch (filename) {
    case "nodes":
      kind = "Node";
      break;
    case "storage-classes":
      kind = "StorageClass";
      break;
    case "namespaces":
      kind = "Namespace";
      break;
    case "pvs":
      kind = "PersistentVolume";
      break;
    case "custom-resource-definitions":
      kind = "CustomResourceDefinition";
      break;
    default:
      kind = filename;
      break;
  }

  return kind;
};

const getApiVersion = (kind: string): string => {
  // TODO: check case where it is possible to have multiple apiGroupVersions/apiVersions for a single kind name
  // totally possible that there will be CRs that use the same "kind name" (e.g.,  "node)
  // for CRs, we can just get the apiVersion from the object
  // however, we may have to hardcode some apiVersions for "default" resources (e.g., non-CRs)
  const apiResourceFile = fs.readFileSync(
    path.join(clusterResourcesDir, "resources.json"),
    "utf8"
  );
  const apiResourcesJson = JSON.parse(apiResourceFile);

  // TODO: maybe clean this up a bit?
  const apiVersion = (() => {
    for (let i = 0; i < apiResourcesJson.length; i++) {
      const resources = apiResourcesJson[i]["resources"];
      for (let j = 0; j < resources.length; j++) {
        if (resources[j]["kind"] === kind) {
          return apiResourcesJson[i]["groupVersion"];
        }
      }
    }
  })() as string;

  return apiVersion;
};

const up = async () => {
  await dockerNetwork();
  await etcdContainer();
  await apiServerContainer();
  parseResourceFiles();
};

export default up;
