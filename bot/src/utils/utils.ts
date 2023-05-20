import * as fs from "fs";
import path from "path";

class Utils {
    dynamicImportFolder<T>(folder: string): {path: string, imported: T}[] {
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
}

export default new Utils();