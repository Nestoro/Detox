const fs = require('fs-extra');
const Artifact = require('./Artifact');
const log = require('../../../utils/logger').child({ __filename });

class FileArtifact extends Artifact {
  constructor({ temporaryPath, ...template }) {
    super(template);
    this.temporaryPath = temporaryPath;
  }

  async doSave(artifactPath) {
    await Artifact.moveTemporaryFile(log, this.temporaryPath, artifactPath);
  }

  async doDiscard() {
    await fs.remove(this.temporaryPath);
  }
}


module.exports = FileArtifact;