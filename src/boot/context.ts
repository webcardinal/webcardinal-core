import type ApplicationController from "./ApplicationController";

let config;

function setWebCardinalConfig(controller: ApplicationController) {
  config = controller.getConfig();
}

function getWebCardinalConfig() {
  return config;
}

export {
  setWebCardinalConfig,
  getWebCardinalConfig
}
