declare module "obsidian-excalidraw-plugin" {
    import { Plugin, TFile } from "obsidian";
    

    export type ExcalidrawElement = unknown;
    export type ExcalidrawView = unknown;
    export type AppState = unknown;
    export type ExportSettings = unknown;
    export type EmbeddedFilesLoader = unknown;

    export default class ExcalidrawPlugin extends Plugin {
        ea: ExcalidrawAutomate;
    }

    export class ExcalidrawAutomate {
        elementsDict: unknown;
        getSceneFromFile(file: TFile): Promise<{elements: ExcalidrawElement[]; appState: AppState;}>
        copyViewElementsToEAforEditing(elements: ExcalidrawElement[], copyImages?: boolean): void
        createPNG(
            templatePath?: string,
            scale?: number,
            exportSettings?: ExportSettings,
            loader?: EmbeddedFilesLoader,
            theme?: string,
            padding?: number,
          ): Promise<Blob>
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