import { constants as fsConstants } from 'fs';
import { access, mkdir } from 'fs/promises';
import { join, parse, resolve } from 'path';
import { x } from 'tar';

const extract = async (
  bundleFile: string,
  outputDir: string,
  ticketId: string | undefined
) => {
  const extractOutputDir = ticketId
    ? resolve(join(outputDir, ticketId))
    : resolve(outputDir);
  const resolvedBundleFile = resolve(bundleFile);

  // if output dir does not exist, create it
  if (
    !(await access(extractOutputDir, fsConstants.F_OK)
      .then(() => true)
      .catch(() => false))
  ) {
    console.log("Output dir does not exist, creating it");
    await mkdir(extractOutputDir, { recursive: true });
    console.log(`Output dir created: ${extractOutputDir}`);
  }

  console.log(
    `Extracting ${resolvedBundleFile} to ${join(
      extractOutputDir,
      // TODO: fix this; we parse twice as a hack to account for .tar.gz
      parse(parse(bundleFile).name).name
    )}`
  );

  await x({
    file: resolvedBundleFile,
    cwd: extractOutputDir,
  });

  console.log(
    `Successfully extracted ${resolvedBundleFile} to ${join(
      extractOutputDir,
      // TODO: fix this; we parse twice as a hack to account for .tar.gz
      parse(parse(bundleFile).name).name
    )}`
  );
};

export default extract;
