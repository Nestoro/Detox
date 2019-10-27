const ArtifactPlugin = require('./ArtifactPlugin');
const FileArtifact = require('../artifact/FileArtifact');

/***
 * @abstract
 */
class TwoSnapshotsPerTestPlugin extends ArtifactPlugin {
  constructor({ api }) {
    super({ api });
    this.snapshots = {};
  }

  async onBeforeEach(testSummary) {
    this.context.testSummary = null;
    this._startSavingSnapshots();

    await super.onBeforeEach(testSummary);
    await this._takeAutomaticSnapshot('beforeEach');
  }

  async onAfterEach(testSummary) {
    await super.onAfterEach(testSummary);

    if (this.shouldKeepArtifactOfTest(testSummary)) {
      await this._takeAutomaticSnapshot('afterEach');
      this._startSavingSnapshots();
    } else {
      this._startDiscardingSnapshots();
    }
  }

  async onAfterAll() {
    await super.onAfterAll();
    this._startSavingSnapshots();
  }

  /***
   * @protected
   * @abstract
   */
  async preparePathForSnapshot(testSummary, snapshotName) {}


  /***
   * Creates a handle for a test artifact (video recording, log, etc.)
   *
   * @abstract
   * @protected
   * @return {Artifact} - an object with synchronous .discard() and .save(path) methods
   */
  createTestArtifact() {}

  /***
   * @public
   * @param {string} name - Artifact name
   * @param {string|Artifact} snapshot - An artifact or temporary file path
   * @returns {void}
   */
  registerSnapshot(name, snapshot) {
    const artifact = typeof snapshot === 'string'
      ? new FileArtifact(snapshot)
      : snapshot;

    this.snapshots[name] = artifact;
    this.api.trackArtifact(artifact);
  }

  async _takeAutomaticSnapshot(name) {
    if (this.enabled) {
      await this._takeSnapshot(name);
    }
  }

  async _takeSnapshot(name) {
    const snapshot = this.createTestArtifact();
    await snapshot.start();
    await snapshot.stop();

    this.registerSnapshot(name, snapshot);
  }

  _startSavingSnapshots() {
    const {testSummary} = this.context;

    for (const [name, snapshot] of Object.entries(this.snapshots)) {
      delete this.snapshots[name];

      if (snapshot) {
        this.api.requestIdleCallback(async () => {
          const snapshotArtifactPath = await this.preparePathForSnapshot(testSummary, name);
          await snapshot.save(snapshotArtifactPath);
          this.api.untrackArtifact(snapshot);
        });
      }
    }
  }

  _startDiscardingSnapshots() {
    for (const [name, snapshot] of Object.entries(this.snapshots)) {
      delete this.snapshots[name];

      if (snapshot) {
        this.api.requestIdleCallback(async () => {
          await snapshot.discard();
          this.api.untrackArtifact(snapshot);
        });
      }
    }
  }
}

module.exports = TwoSnapshotsPerTestPlugin;
