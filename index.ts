#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { cp, readFile, writeFile } from "node:fs/promises";
import { glob } from "glob";
import color from "picocolors";
import prompts from "prompts";
import yargs from "yargs";
import { execa } from "execa";
import { hideBin } from "yargs/helpers";

// List of templates
const TEMPLATES = [
  {
    title: "nodejs-express-basic",
    value: "nodejs-express-basic",
  },
];

// List of extras
const EXTRAS = {
  "next-eslint-ts-shadcn": [
    {
      title: "Mercado Pago",
      value: "mercadopago",
    },
    {
      title: "Clerk Auth",
      value: "clerk",
    },
    {
      title: "Auth0",
      value: "auth0",
    },
    {
      title: "Supabase",
      value: "supabase",
    },
  ],
  "next-eslint-ts-tw": [
    {
      title: "Mercado Pago",
      value: "mercadopago",
    },
    {
      title: "Clerk Auth",
      value: "clerk",
    },
    {
      title: "Auth0",
      value: "auth0",
    },
    {
      title: "Supabase",
      value: "supabase",
    },
  ],
};

// Specify CLI arguments
const args = yargs(hideBin(process.argv)).options({
  name: {
    alias: "n",
    type: "string",
    description: "Name of the project",
  },
  template: {
    alias: "t",
    type: "string",
    description: "Template to use",
  },
  packageManager: {
    alias: "pm",
    type: "string",
    choices: ["npm", "yarn", "pnpm"],
    description: "Package manager to use for installing dependencies",
  },
});

// Orverride arguments passed on the CLI
prompts.override(args.argv);

async function main() {
  // Get the initial values for the prompts
  const {
    _: [initialName, initialProject],
  } = await args.argv;

  // Create the project prompt
  const project = await prompts(
    [
      {
        type: "text",
        name: "name",
        message: "What is the name of your project?",
        initial: initialName || "myproject",
        validate: (value) => {
          if (value.match(/[^a-zA-Z0-9-_]+/g))
            return "Project name can only contain letters, numbers, dashes and underscores";

          return true;
        },
      },
      {
        type: "select",
        name: "template",
        message: `Which template would you like to use?`,
        initial: initialProject || 0,
        choices: TEMPLATES,
      },
      {
        type: 'select',
        name: 'packageManager',
        message: 'Choose your package manager',
        choices: [
          { value: 'npm', title: 'npm' },
          { value: 'pnpm', title: 'pnpm' },
          { value: 'yarn', title: 'yarn' },
        ]
      }
    ],
    {
      onCancel: () => {
        console.log("\nBye 👋\n");

        process.exit(0);
      },
    },
  );

  // Get the template folder for the selected template
  const template = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "templates",
    project.template,
  );

  // Get the destination folder for the project
  const destination = path.join(process.cwd(), project.name);

  // Copy files from the template folder to the current directory
  await cp(path.join(template, "project"), destination, { recursive: true });

  // Get the extras for the selected template
  let extras: string[] = [];

  if (EXTRAS[project.template]) {
    const { extras: results } = await prompts({
      type: "multiselect",
      name: "extras",
      message: "Which extras would you like to add?",
      instructions: false,
      choices: EXTRAS[project.template],
    });

    // Assign to variable
    extras = results;

    for await (const extra of extras) {
      // Copy files from the extra folder to the current directory
      await cp(path.join(template, "extras", extra), destination, { recursive: true });
    }
  }

  async function installDependencies(destination, packageManager) {
    // Change to the project directory
    process.chdir(destination);

    // Run the specified package manager install command
    console.log(`\nInstalling dependencies using ${packageManager}...\n`);
    try {
      const { stdout } = await execa(packageManager, ['install']);
      console.log(stdout);
    } catch (error) {
      console.error("Error durante la instalación:", error);
    }
  }

  // Install dependencies
  await installDependencies(destination, project.packageManager);


  // Get all files from the destination folder
  const files = await glob(`**/*`, { nodir: true, cwd: destination, absolute: true });

  // Read each file and replace the tokens
  for await (const file of files) {
    const data = await readFile(file, "utf8");
    const draft = data.replace(/{{name}}/g, project.name);

    await writeFile(file, draft, "utf8");
  }

  // Log outro message
  console.log("\n✨ Project created ✨");
  console.log(`\n${color.yellow(`Next steps:`)}\n`);
  console.log(`${color.green(`cd`)} ${project.name}`);
  console.log(`${color.green(`npm`)} install`);
  console.log(`${color.green(`npm`)} dev`);

  // Extras log
  if (extras.length) {
    console.log(
      `\nCheck out the ${color.italic("README.md")} file inside ${color.green(
        extras.join(", "),
      )} for more info on how to use it.`,
    );
  }

  // Contact logs
  console.log("\n---\n");
  console.log(`Preguntas 👀? ${color.underline(color.cyan("https://www.linkedin.com/in/ulisesvaf/"))}`);
}

// Run the main function
main().catch(console.error);
