declare module "obsidian-excalidraw-plugin" {
    import { Plugin, TFile } from "obsidian";
    

    export type ExcalidrawElement = any;
    export type ExcalidrawView = any;
    export type AppState = any;
    export type ExportSettings = any;
    export type EmbeddedFilesLoader = any;

    export default class ExcalidrawPlugin extends Plugin {
        ea: ExcalidrawAutomate;
    }

    export class ExcalidrawAutomate {
        elementsDict: any;
        getSceneFromFile(file: TFile): Promise<{elements: ExcalidrawElement[]; appState: AppState;}>
        copyViewElementsToEAforEditing(elements: ExcalidrawElement[], copyImages?: boolean): void
        createPNG(
            templatePath?: string,
            scale?: number,
            exportSettings?: ExportSettings,
            loader?: EmbeddedFilesLoader,
            theme?: string,
            padding?: number,
          ): Promise<any>
          createSVG(
            templatePath?: string,
            embedFont?: boolean,
            exportSettings?: ExportSettings, 
            loader?: EmbeddedFilesLoader,
            theme?: string,
            padding?: number,
          ): Promise<SVGSVGElement> 
    }
}