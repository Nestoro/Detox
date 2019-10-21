module.exports = class FakePathBuilder {
  buildPathForTestArtifact(artifactName, testSummary) {
    return (testSummary ? (testSummary.fullName + '/') : '') + artifactName;
  }
};