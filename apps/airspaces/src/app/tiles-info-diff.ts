import { program } from 'commander';
import fs from 'fs-extra';

program
  .option('-n, --new <file>', 'new fingerprints', 'tiles-info.json')
  .option('-r, --ref <file>', 'ref fingerprints', 'assets/ref/tiles-info.json')
  .option('-o, --output <file>', 'diff', 'tiles-info-diff.json')
  .parse();

const diff = {
  added: [],
  updated: [],
  deleted: [],
  numAdded: 0,
  numUpdated: 0,
  numDeleted: 0,
  numSame: 0,
};

const newTiles = JSON.parse(fs.readFileSync(program.opts().new, 'utf8'));
const refTiles = JSON.parse(fs.readFileSync(program.opts().ref, 'utf8'));

for (const [name, fp] of Object.entries(newTiles.fingerprint)) {
  if (name in refTiles.fingerprint) {
    if (fp === refTiles.fingerprint[name]) {
      diff.numSame++;
    } else {
      diff.numUpdated++;
      diff.updated.push(name);
    }
  } else {
    diff.numAdded++;
    diff.added.push(name);
  }
}

for (const name of Object.keys(refTiles.fingerprint)) {
  if (!(name in newTiles.fingerprint)) {
    diff.numDeleted++;
    diff.deleted.push(name);
  }
}

fs.writeFileSync(program.opts().output, JSON.stringify(diff));
