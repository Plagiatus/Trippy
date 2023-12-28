import * as fs from "fs";
import path from "path";
import crypto from "crypto";

class Utils {
	private readonly hasValuePredicate = (value: unknown) => value !== null && value !== undefined;

	dynamicImportFolder<T = unknown>(folder: string): {path: string, imported: T}[] {
		let files: string[] = fs.readdirSync(`${this.executionRootPath}/${folder}`);
		let importedFiles: {path: string, imported: T}[] = [];

		for (const file of files) {
			let path: string = `${folder}/${file}`;
			const imports = this.importPath<T>(path);
			importedFiles.push(...imports);
		}

		return importedFiles;
	}

	private importPath<T>(path: string) {
		if(path.endsWith(".js") || path.endsWith(".ts")){
			const imported: T = require(`${this.executionRootPath}/${path}`).default;
			return [{
				imported,
				path,
			}];
		}
		
		if(fs.statSync(`${this.executionRootPath}/${path}`).isDirectory()){
			const importsFromFolder = this.dynamicImportFolder<T>(path);
			return importsFromFolder;
		}

		return [];
	}

	public get executionRootPath() {
		return path.join(require.main?.filename ?? __filename, "./../");
	}

	public newId() {
		return crypto.randomUUID();
	}

	public async asyncMap<TElement,TReturn>(array: ReadonlyArray<TElement>, map: (element: TElement, index: number, array: ReadonlyArray<TElement>) => Promise<TReturn>): Promise<TReturn[]> {
		const mapPromises: Promise<TReturn>[] = [];
		for (let i = 0; i < array.length; i++) {
			mapPromises.push(map(array[i],i,array));
		}
		return await Promise.all(mapPromises);
	}

	public async asyncForeach<TElement>(array: ReadonlyArray<TElement>, foreach: (element: TElement, index: number, array: ReadonlyArray<TElement>) => Promise<void>): Promise<void> {
		await this.asyncMap(array, foreach);
	}

	public getHasValuePredicate<TValue>()  {
		return this.hasValuePredicate as ((value: TValue|null|undefined) => value is TValue);
	}
}

export default new Utils();