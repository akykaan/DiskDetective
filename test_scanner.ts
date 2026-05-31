import { scanFolder } from './electron/scanner.ts';
import path from 'path';

async function test() {
  const { tree, ignoredPaths } = await scanFolder(
    path.join(__dirname, 'src'),
    (p) => {
      // console.log(p.scannedFiles);
    },
    { ignoreUnnecessary: true }
  );

  console.log('Tree file count:', tree.fileCount);
  console.log('Tree children count:', tree.children.length);
  console.log('Ignored paths:', ignoredPaths);
}

test().catch(console.error);
