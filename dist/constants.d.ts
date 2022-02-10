export declare const ETCD_IMAGE = "k8s.gcr.io/etcd:3.4.13-0";
export declare const APISERVER_IMAGE = "k8s.gcr.io/kube-apiserver:v1.21.1";
export declare const ARTIFACTS_DIR_NAME = ".dkp-mirror";
export declare const APISERVER_TOKEN_FILE_NAME = "tokens.txt";
export declare const APISERVER_TOKEN_FILE_DATA = "\nmirror,mirror,mirror,system:masters\n";
export declare const KUBECONFIG_FILE_NAME = "kubeconfig.mirror";
export declare const KUBECONFIG_DATA = "\napiVersion: v1\nkind: Config\ncurrent-context: mirror\nclusters:\n- cluster:\n    server: https://localhost:6443\n    insecure-skip-tls-verify: true\n  name: mirror\nusers:\n- name: mirror\n  user:\n    token: mirror \ncontexts:\n- context:\n    cluster: mirror\n    user: mirror\n  name: mirror";
