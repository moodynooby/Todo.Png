import type { ExcalidrawElement } from "@excalidraw/element/types";

import type { cleanAppStateForExport } from "../appState";
import type { AppState, BinaryFiles } from "../types";

export interface ExportedDataState {
  type: string;
  version: number;
  source: string;
  elements: readonly ExcalidrawElement[];
  appState: ReturnType<typeof cleanAppStateForExport>;
  files: BinaryFiles | undefined;
}

/**
 * Map of legacy AppState keys, with values of:
 *  [<legacy type>, <new AppState proeprty>]
 *
 * This is a helper type used in downstream abstractions.
 * Don't consume on its own.
 */
export type LegacyAppState = {
  /** @deprecated #6213 TODO remove 23-06-01 */
  isSidebarDocked: [boolean, "defaultSidebarDockedPreference"];
};

export interface ImportedDataState {
  type?: string;
  version?: number;
  source?: string;
  elements?: readonly ExcalidrawElement[] | null;
  appState?: Readonly<
    Partial<
      AppState & {
        [T in keyof LegacyAppState]: LegacyAppState[T][0];
      }
    >
  > | null;
  scrollToContent?: boolean;
  files?: BinaryFiles;
}
