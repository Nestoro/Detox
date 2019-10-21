const DetoxConfigError = require('./errors/DetoxConfigError');
const uuid = require('./utils/uuid');
const argparse = require('./utils/argparse');
const getPort = require('get-port');

async function defaultSession() {
  return {
    server: `ws://localhost:${await getPort()}`,
    sessionId: uuid.UUID()
  };
}

function validateSession(session) {
  if (!session) {
    throw new Error(`No session configuration was found, pass settings under the session property`);
  }

  if (!session.server) {
    throw new Error(`session.server property is missing, should hold the server address`);
  }

  if (!session.sessionId) {
    throw new Error(`session.sessionId property is missing, should hold the server session id`);
  }
}

function throwOnEmptyDevice() {
  throw new DetoxConfigError(`'device' property is empty, should hold the device query to run on (e.g. { "type": "iPhone 11 Pro" }, { "avdName": "Nexus_5X_API_29" })`);
}

function throwOnEmptyType() {
  throw new DetoxConfigError(`'type' property is missing, should hold the device type to test on (e.g. "ios.simulator" or "android.emulator")`);
}

function throwOnEmptyBinaryPath() {
  throw new DetoxConfigError(`'binaryPath' property is missing, should hold the app binary path`);
}

function composeDeviceConfig({ configurations }) {
  const configurationName = argparse.getArgValue('configuration');
  const deviceOverride = argparse.getArgValue('device-name');

  const deviceConfig = (!configurationName && _.size(configurations) === 1)
    ? _.values(configurations)[0]
    : configurations[configurationName];

  if (!deviceConfig) {
    throw new Error(`Cannot determine which configuration to use. use --configuration to choose one of the following:
                        ${Object.keys(configurations)}`);
  }

  if (!deviceConfig.type) {
    throwOnEmptyType();
  }

  deviceConfig.device = deviceOverride || deviceConfig.device || deviceConfig.name;
  delete deviceConfig.name;

  if (_.isEmpty(deviceConfig.device)) {
    throwOnEmptyDevice();
  }

  return deviceConfig;
}

function resolvePathBuilder(pathBuilder) {
  if (typeof pathBuilder === 'string') {
    const pathBuilderModulePath = pathBuilder;
    const pathBuilderAbsolutePath = path.isAbsolute(pathBuilderModulePath)
      ? pathBuilderModulePath
      : path.join(process.cwd(), pathBuilderModulePath);

    return require(pathBuilderAbsolutePath);
  }

  return pathBuilder;
}

function isPluginEnabled(key) {

}

function composeArtifactsConfig(deviceConfig, detoxConfig) {
  const artifactsConfig = _.merge({}, detoxConfig.artifacts, deviceConfig.artifacts);
  artifactsConfig.pathBuilder = resolvePathBuilder(artifactsConfig.pathBuilder);
  delete deviceConfig.artifacts;
  return artifactsConfig;
}

module.exports = {
  defaultSession,
  validateSession,
  throwOnEmptyDevice,
  throwOnEmptyType,
  throwOnEmptyBinaryPath,
  composeDeviceConfig,
  composeArtifactsConfig,
};
