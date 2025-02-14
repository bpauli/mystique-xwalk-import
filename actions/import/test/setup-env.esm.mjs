import { resolve } from 'path';
import { fileURLToPath } from 'url';

global.__testdir = resolve(fileURLToPath(import.meta.url), '..');
