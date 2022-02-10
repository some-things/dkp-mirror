export const ETCD_IMAGE = "k8s.gcr.io/etcd:3.4.13-0";
export const APISERVER_IMAGE = "k8s.gcr.io/kube-apiserver:v1.21.1";
export const ARTIFACTS_DIR_NAME = ".dkp-mirror";
export const APISERVER_TOKEN_FILE_NAME = "tokens.txt";
export const APISERVER_TOKEN_FILE_DATA = `
mirror,mirror,mirror,system:masters
`;
export const KUBECONFIG_FILE_NAME = "kubeconfig.mirror";
export const KUBECONFIG_DATA = `
apiVersion: v1
kind: Config
current-context: mirror
clusters:
- cluster:
    server: https://localhost:6443
    insecure-skip-tls-verify: true
  name: mirror
users:
- name: mirror
  user:
    token: mirror 
contexts:
- context:
    cluster: mirror
    user: mirror
  name: mirror`;
