import * as fs from "fs";
import path from "path";
import crypto from "crypto";
import { APIEmbedField, MessageCreateOptions, SnowflakeUtil } from "discord.js";

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

	public fieldsInColumns(fields: ReadonlyArray<APIEmbedField>, columns: number, spacing: number = 5) {
		const rows: APIEmbedField[][] = [];
		const spacingSpaces = new Array(spacing).fill(" ").join("");
		for (let i = 0; i < fields.length; i += columns) {
			const row = fields.slice(i, i + columns).map(field => ({...field, inline: true}));

			if (spacing > 0) {
				for (let i = 1; i < row.length; i += 2) {
					row.splice(i, 0, {name: spacingSpaces, value: spacingSpaces, inline: true});
				}
			}

			row.push({name: " ", value: " ", inline: false});

			rows.push(row);
		}

		if (rows.length > 0) {
			const lastRow = rows[rows.length - 1];
			lastRow.splice(lastRow.length - 1, 1);
		}

		return rows.flatMap(row => row);
	}

	public getUsernameString(userData: {username: string, validated: boolean}|undefined): string|undefined
	public getUsernameString(userData: {username: string, validated: boolean}): string
	public getUsernameString(userData: {username: string, validated: boolean}|undefined): string|undefined {
		if (!userData) {
			return undefined;
		}

		return "`" + userData.username + "`" + (userData.validated ? " :white_check_mark:" : "") 
	}

	/**
	 * Creates the options for turning on nonce for a message.
	 * 
	 * When Discord gets a message with "enforceNonce" and "nonce" then Discord will remember the nonce.
	 * All other messages with the same nonce will be ignored for the next few minutes.
	 */
	public createNonceOptions() {
		return {
			enforceNonce: true,
			nonce: SnowflakeUtil.generate().toString(),
		} satisfies MessageCreateOptions
	}
}

export default new Utils();