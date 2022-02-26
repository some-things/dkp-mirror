#!/usr/bin/env node
import { Command } from 'commander'

import down from './down/down'
import extract from './extract/extract'
import up from './up/up'
import { defaultExtractBundleDirectory } from './utils/directories'

const program = new Command();

program
  .name("dkp-mirror")
  .description("Mirror your DKP cluster from diagnostic bundle data")
  .version("1.0.0");

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
  .action(async () => {
    await up();
  });

program
  .command("down")
  .description("Shutdown the DKP mirror")
  .action(async () => {
    await down();
  });

program.parse();
