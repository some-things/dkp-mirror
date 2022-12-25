import { Dirent, readdirSync, readFileSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import { APISERVER_TOKEN_FILE_DATA, APISERVER_TOKEN_FILE_NAME, ARTIFACTS_DIR_NAME, KUBECONFIG_FILE_DATA, KUBECONFIG_FILE_NAME } from '../constants';
import { currentWorkingDir, getClusterResourcesDir, getCustomResourcesDir } from '../utils/directories';
import apiServerContainer from '../utils/docker/apiServer';
import etcdContainer from '../utils/docker/etcd';
import dockerNetwork from '../utils/docker/network';
import etcdClient from '../utils/etcd/client';
import { resourceFileToJSON } from '../utils/resourceFileToJSON';

const defaultClusterResourceFilesToParse: string[] = [
  "custom-resource-definitions.json",
  // todo: test groups
  "groups.json",
  "namespaces.json",
  "nodes.json",
  "pvs.json",
  // todo: implement resources.json (api-resources)
  // "resources.json",
  "storage-classes.json",
];

const defaultNamespacedResourceDirsToParse: string[] = [
  "cronjobs",
  "deployments",
  "events",
  "image-pull-secrets",
  "ingress",
  "jobs",
  // todo: test limitranges
  "limitranges",
  "pods",
  "pvcs",
  "replicasets",
  "services",
  "statefulsets",
];

// todo: add flags to ignore other dirs so we can default include all
const defaultDirectoriesToIgnore: string[] = [
  "custom-resources",
  // not really useful since it is only based on the account executing the command
  // also not really useful bc it isn't an actual api resource
  "auth-cani-list",
];

// todo: add flags to ignore other files so we can default include all
// todo: evaluate implementing resources.json (api-resources)
const defaultFilesToIgnore: string[] = ["resources.json"];

const isNamespacedResource = (file: Dirent): boolean => {
  if (file.isDirectory()) {
    return true;
  } else {
    return false;
  }
};

// todo: condense these
const getClusterScopedResources = () => {
  return readdirSync(getClusterResourcesDir(), {
    withFileTypes: true,
  }).filter(
    (f) =>
      !defaultDirectoriesToIgnore.includes(f.name) &&
      !defaultFilesToIgnore.includes(f.name) &&
      !isNamespacedResource(f)
  );
};

const getNamespaceScopedResources = () => {
  return readdirSync(getClusterResourcesDir(), {
    withFileTypes: true,
  }).filter(
    (f) =>
      !defaultDirectoriesToIgnore.includes(f.name) &&
      !defaultFilesToIgnore.includes(f.name) &&
      isNamespacedResource(f)
  );
};

const getClusterScopedCustomResources = () => {
  return readdirSync(getCustomResourcesDir(), {
    withFileTypes: true,
  }).filter(
    (f) =>
      !defaultDirectoriesToIgnore.includes(f.name) &&
      !defaultFilesToIgnore.includes(f.name) &&
      !isNamespacedResource(f)
  );
};

const getNamespaceScopedCustomResources = () => {
  return readdirSync(getCustomResourcesDir(), {
    withFileTypes: true,
  }).filter(
    (f) =>
      !defaultDirectoriesToIgnore.includes(f.name) &&
      !defaultFilesToIgnore.includes(f.name) &&
      isNamespacedResource(f)
  );
};

const validFileExtensions = [".json", ".yaml", ".yml"];

const isValidFileType = (file: Dirent): boolean => {
  if (
    validFileExtensions.includes(path.extname(file.name)) &&
    !file.name.includes("-errors")
  ) {
    return true;
  } else {
    return false;
  }
};

// we do this so that we know what dirs to look at
// todo: handle file paths better so this isn't needed
const isCustomResource = (file: Dirent): boolean => {
  if (
    !defaultClusterResourceFilesToParse.includes(file.name) &&
    !defaultNamespacedResourceDirsToParse.includes(file.name)
  ) {
    return true;
  } else {
    return false;
  }
};

// TODO: use Kind instead of filename?
// this is the path of the key in etcd
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
    case "ingress":
      kindPath = "ingress/";
      break;
    case "podsecuritypolicies":
      kindPath = "podsecuritypolicy/";
      break;
    case "storage-classes":
      kindPath = "storageclasses/";
      break;
    case "namespace":
      kindPath = "namespaces/";
      break;
    case "pvs":
      kindPath = "persistentvolumes/";
      break;
    case "custom-resource-definitions":
      kindPath = "apiextensions.k8s.io/customresourcedefinitions/";
      break;
    case "pvcs":
      kindPath = "persistentvolumeclaims/";
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
    case "cronjobs":
      kind = "CronJob";
      break;
    case "deployments":
      kind = "Deployment";
      break;
    case "events":
      kind = "Event";
      break;
    case "ingress":
      kind = "Ingress";
      break;
    case "jobs":
      kind = "Job";
      break;
    case "limitranges":
      kind = "LimitRange";
      break;
    case "pods":
      kind = "Pod";
      break;
    case "pvcs":
      kind = "PersistentVolumeClaim";
      break;
    case "services":
      kind = "Service";
      break;
    case "statefulsets":
      kind = "StatefulSet";
      break;
    default:
      kind = filename;
      break;
  }

  return kind;
};

const parseResources = (files: Dirent[]) => {
  for (let i = 0; i < files.length; i++) {
    const namespaced: boolean = isNamespacedResource(files[i]);
    const customResource: boolean = isCustomResource(files[i]);
    //      const apiGroup = f.name.split(".").slice(1, -1).join(".");
    // todo: reevaluate the stuff below and where it is used
    const fileBasename: string = customResource
      ? files[i].name.replace(/(.json|.yaml|.yml)/g, "")
      : path.parse(files[i].name).name;
    const kind: string = getKind(fileBasename);
    const kindPath: string = getKindPath(fileBasename);
    // const apiGroup: string = fileBasename.split(".").slice(1, -1).join(".");
    const apiGroup: string = files[i].name.split(".").slice(1).join(".");
    const filesToParsePaths: string[] = [];

    // skip processing the file if:
    // * it is not a json file
    // * it is not a yaml file
    // * it is an errors file
    if (!namespaced && !isValidFileType(files[i])) {
      console.warn(`warning: skipping invalid file ${files[i].name}...`);
      continue;
    }

    // namespaced
    if (namespaced) {
      // for each file in the resource's directory, push it to the filesToParse array
      readdirSync(
        path.join(
          customResource ? getCustomResourcesDir() : getClusterResourcesDir(),
          files[i].name
        ),
        {
          withFileTypes: true,
        }
      ).forEach((f) => {
        if (isValidFileType(f)) {
          filesToParsePaths.push(
            path.join(
              customResource
                ? getCustomResourcesDir()
                : getClusterResourcesDir(),
              files[i].name,
              f.name
            )
          );
        }
      });
      // non-namespaced
    } else {
      filesToParsePaths.push(
        path.join(
          customResource ? getCustomResourcesDir() : getClusterResourcesDir(),
          files[i].name
        )
      );
    }

    for (let j = 0; j < filesToParsePaths.length; j++) {
      const objects = resourceFileToJSON(filesToParsePaths[j]);

      console.log(`info: parsing ${filesToParsePaths[j]}`);

      // may need to make this synchronous
      objects.forEach(async (obj: any) => {
        const objName = obj.metadata?.name;
        if (!objName) {
          //   console.warn(
          //     `warning: skipping object without name in file: ${filesToParsePaths[j]}`
          //   );
          return;
        }

        // todo: ensure all files include namespace in the objects
        // (may not have been the case for older versions of support-bundle)
        // const namespace: string | null = namespaced
        // ? path.parse(files[i].name).name
        // : null;
        const objNamespace = obj.metadata?.namespace;

        // todo: evaluate this...
        if (!customResource) {
          obj.kind = kind;
          obj.apiVersion = getApiVersion(kind);
        }

        const etcdKey = `/registry/${
          customResource ? apiGroup + "/" : kindPath
        }${
          customResource
            ? // todo: this gets the kind name for the path in etcd; possibly move this to var at the top
              files[i].name.split(".")[0] + "/"
            : ""
        }${namespaced ? objNamespace + "/" : ""}${objName}`;

        try {
          await etcdClient.put(etcdKey).value(JSON.stringify(obj));
        } catch (e) {
          console.error(`error: etcd put failed for key ${etcdKey}: ${e}`);
        }
      });
    }
  }
};

const getApiVersion = (kind: string): string => {
  // TODO: check case where it is possible to have multiple apiGroupVersions/apiVersions for a single kind name
  // need to check more for GVKs
  // totally possible that there will be CRs that use the same "kind name" (e.g.,  "node")
  // for CRs, we can just get the apiVersion from the object
  // however, we may have to hardcode some apiVersions for "default" resources (e.g., non-CRs)
  const apiResourcesJson = JSON.parse(
    readFileSync(path.join(getClusterResourcesDir(), "resources.json"), "utf8")
  );

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

const createArtifactsDir = async () => {
  console.log("Creating artifacts directory");
  await mkdir(path.join(currentWorkingDir, ARTIFACTS_DIR_NAME));
};

const writeApiserverTokenFile = async () => {
  console.log("Writing kube-apiserver token file");
  await writeFile(
    path.join(currentWorkingDir, ARTIFACTS_DIR_NAME, APISERVER_TOKEN_FILE_NAME),
    APISERVER_TOKEN_FILE_DATA
  );
};

const writeKubeconfig = async () => {
  console.log("Writing kubeconfig");
  await writeFile(
    path.join(currentWorkingDir, ARTIFACTS_DIR_NAME, KUBECONFIG_FILE_NAME),
    KUBECONFIG_FILE_DATA
  );
};

const up = async () => {
  console.log("Starting DKP mirror!");
  await dockerNetwork();
  await etcdContainer();
  parseResources([
    ...getClusterScopedResources(),
    ...getNamespaceScopedResources(),
    ...getClusterScopedCustomResources(),
    ...getNamespaceScopedCustomResources(),
  ]);
  await createArtifactsDir();
  await writeApiserverTokenFile();
  await apiServerContainer();
  await writeKubeconfig();
  console.log("Successfully started DKP mirror!");
  console.log(`
    To access the DKP mirror, execute:
    export KUBECONFIG=${path.join(
      currentWorkingDir,
      ARTIFACTS_DIR_NAME,
      KUBECONFIG_FILE_NAME
    )}`);
};

export default up;
