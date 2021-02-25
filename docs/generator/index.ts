import { Config } from "@stencil/core";
import { JsonDocs } from "@stencil/core/internal";

const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

async function generator(docs: JsonDocs, _config: Config) {
  const docsPath = path.join(process.cwd(), "docs/custom");
  const componentsPath = path.join(docsPath, "components");

  if (fs.existsSync(docsPath)) {
    fs.rmdirSync(docsPath, { recursive: true });
  }
  if (fs.existsSync(componentsPath)) {
    fs.rmdirSync(componentsPath, { recursive: true });
  }

  fs.mkdirSync(docsPath);
  fs.mkdirSync(componentsPath);

  const cheatsheet = {};
  const writeFile = promisify(fs.writeFile);

  /*
  TODO: read package.json, find source
        then use this generator inside @cardinal/internals as well
  */

  for (const component of docs.components) {
    const componentPath = path.join(componentsPath, `${component.tag}.json`);

    try {
      await writeFile(componentPath, JSON.stringify(component, null, 2));
      cheatsheet[component.tag] = {
        source: "webcardinal-core",
        path: path.relative(docsPath, componentPath).replace(/\\/g, "/")
      };
    } catch (error) {
      console.error(error);
    }

    fs.writeFileSync(path.join(docsPath, "docs.json"), JSON.stringify(docs, null, 2));
    fs.writeFileSync(path.join(docsPath, "cheatsheet.json"), JSON.stringify(cheatsheet, null, 2));
  }
}

export { generator };
