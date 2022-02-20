/// <reference types="dockerode" />
declare const apiServerContainer: () => Promise<import("dockerode").Container>;
export default apiServerContainer;
