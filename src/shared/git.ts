import * as path from 'path';
import * as fs from 'fs';

export function findGitRoot(startPath: string): string | null {
    let dir = path.dirname(startPath);
    while (true) {
        if (fs.existsSync(path.join(dir, '.git'))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }
    return null;
}