import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
	input: 'src/index.ts',
	output: {
		// dir: 'dist/',
		file: 'dist/module.js',
		format: 'esm'
	},
	plugins: [
		nodeResolve(),
		// @ts-ignore
		typescript({
			tsconfig: './tsconfig.json',
			compilerOptions: {
				rootDir: 'src/'
			}
		})
	]
};