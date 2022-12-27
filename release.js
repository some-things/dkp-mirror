#!/usr/bin/env node
const os = require("os");
const { exec } = require("pkg");
const path = require("path");
const fs = require("fs");

const arch = os.arch();
const machine = os.machine();
const platform = os.platform();
const type = os.type();
const nodeTargetVersion = "node16";

const platformToPkg = {
  darwin: "macos",
  linux: "linux",
};

const archToPkg = {
  x64: "x64",
  arm64: "arm64",
};

const platformArchToPkgBuilds = {
  "darwin-x64": [
    `${nodeTargetVersion}-${platformToPkg.darwin}-${archToPkg.x64}`,
    `${nodeTargetVersion}-${platformToPkg.linux}-${archToPkg.x64}`,
  ],
  "darwin-arm64": [
    `${nodeTargetVersion}-${platformToPkg.darwin}-${archToPkg.x64}`,
    `${nodeTargetVersion}-${platformToPkg.linux}-${archToPkg.x64}`,
  ],
  "linux-x64": [
    `${nodeTargetVersion}-${platformToPkg.darwin}-${archToPkg.x64}`,
    `${nodeTargetVersion}-${platformToPkg.linux}-${archToPkg.x64}`,
  ],
};

const cleanReleaseDir = () => {
  console.log("info: cleaning release directory");
  const filesToDelete = fs.readdirSync("release");

  filesToDelete.forEach((file) => {
    console.log(`info: deleting ${file}`);
    fs.unlinkSync(path.join("release", file), (err) => {
      if (err) {
        throw err;
      }
    });
  });

  console.log("info: cleaned release directory");
};

const build = async () => {
  const platformArch = `${platform}-${arch}`;
  const pkgBuilds = platformArchToPkgBuilds[platformArch];

  if (!pkgBuilds) {
    console.error("unsupported platform");
    process.exit(1);
  }

  for (const build in pkgBuilds) {
    console.log(`info: building ${pkgBuilds[build]}`);

    await exec([
      "package.json",
      "--target",
      pkgBuilds[build],
      "--output",
      `release/dkp-mirror-${pkgBuilds[build]}`,
      "--options",
      "max-old-space-size=8192",
    ]);

    console.log(`info: built ${pkgBuilds[build]}`);
  }
};

const main = async () => {
  cleanReleaseDir();
  await build();
};

main();
