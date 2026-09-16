import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
await build({entryPoints:[fileURLToPath(new URL('./app.js',import.meta.url))],outfile:fileURLToPath(new URL('../assets/app.js',import.meta.url)),bundle:true,minify:true,format:'esm',target:'es2020',define:{'process.env.NODE_ENV':'"production"'}});
