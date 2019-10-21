const path = require('path');
const sanitizeFilename = require('sanitize-filename');

const RUN_REGEXP = /^(.*)#(\d+)$/m;
const SANITIZE_OPTIONS = {replacement: '_'};
const sanitize = (filename) => sanitizeFilename(filename, SANITIZE_OPTIONS);

module.exports = {
  rootDir: path.join(__dirname, '..', '.benchmarks'),

  buildPathForTestArtifact(rawArtifactName, testSummary = null) {
    const rawFullname = testSummary && testSummary.fullName || '';

    const [fullName, runId] = RUN_REGEXP.test(rawFullname)
      ? rawFullname.match(RUN_REGEXP)
      : [rawFullname];

    const artifactName = runId != null
      ? `${runId}.${rawArtifactName}`
      : rawArtifactName;

    const segments = [this.rootDir, sanitize(fullName), sanitize(artifactName)];

    return path.join(...segments.filter(Boolean));
  },
};
