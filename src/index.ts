#!/usr/bin/env node
import { Command } from 'commander';

import down from './down/down';
import extract from './extract/extract';
import up from './up/up';
import { defaultExtractBundleDirectory } from './utils/directories';

const program = new Command();

program
  .name("dkp-mirror")
  .description("Mirror your DKP cluster from diagnostic bundle data")
  .version("v1.3.0");

program
  .command("extract")
  .description("Extract diagnostic bundle data from a DKP diagnostic bundle")
  .argument("<bundle-file>", "Diagnostic bundle to extract")
  .option(
    "-o, --output-dir [output-dir]",
    "Output directory",
    `${defaultExtractBundleDirectory}`
  )
  .option("-t, --ticket-id [ticket-id]", "Ticket ID")
  .action(async (bundle, { outputDir, ticketId }) => {
    await extract(bundle, outputDir, ticketId);
  });

program
  .command("up")
  .description("Start the DKP mirror")
  .option(
    "-s, --sync",
    "Disables async (parallel) execution; useful if etcd is overloaded, but will take longer to complete",
    false
  )
  .action(async ({ sync }) => {
    await up(sync);
  });

program
  .command("down")
  .description("Shutdown the DKP mirror")
  .action(async () => {
    await down();
  });

program.parse();
