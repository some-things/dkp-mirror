import { Command } from "commander";
import up from "./up/up";

const program = new Command();

program
  .name("dkp-mirror")
  .description("Mirror your DKP cluster from diagnostic bundle data")
  .version("0.0.1");

program
  .command("extract")
  .description("Extract diagnostic bundle data from a DKP diagnostic bundle")
  .argument("<bundle-file>", "The diagnostic bundle to extract")
  .action((bundle) => {
    console.log(`extracting bundle: ${bundle}!`);
  });

program
  .command("up")
  .description("Start the DKP mirror")
  .action(() => {
    console.log("Starting DKP mirror!");
    up();
  });

program.parse();
