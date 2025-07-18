import type {
  ExcalidrawElement,
  OrderedExcalidrawElement,
} from "@excalidraw/element/types";

import type { CaptureUpdateActionType } from "@excalidraw/element";

import type {
  AppClassProperties,
  AppState,
  ExcalidrawProps,
  BinaryFiles,
  UIAppState,
} from "../types";
import type React from "react";

export type ActionSource =
  | "ui"
  | "keyboard"
  | "contextMenu"
  | "api"
  | "commandPalette";

/** if false, the action should be prevented */
export type ActionResult =
  | {
      elements?: readonly ExcalidrawElement[] | null;
      appState?: Partial<AppState> | null;
      files?: BinaryFiles | null;
      captureUpdate: CaptureUpdateActionType;
      replaceFiles?: boolean;
    }
  | false;

type ActionFn = (
  elements: readonly OrderedExcalidrawElement[],
  appState: Readonly<AppState>,
  formData: any,
  app: AppClassProperties,
) => ActionResult | Promise<ActionResult>;

export type UpdaterFn = (res: ActionResult) => void;
export type ActionFilterFn = (action: Action) => void;

export type ActionName =
  | "copy"
  | "cut"
  | "paste"
  | "copyAsPng"
  | "copyAsSvg"
  | "copyText"
  | "sendBackward"
  | "bringForward"
  | "sendToBack"
  | "bringToFront"
  | "copyStyles"
  | "selectAll"
  | "pasteStyles"
  | "gridMode"
  | "zenMode"
  | "objectsSnapMode"
  | "stats"
  | "changeStrokeColor"
  | "changeBackgroundColor"
  | "changeFillStyle"
  | "changeStrokeWidth"
  | "changeStrokeShape"
  | "changeSloppiness"
  | "changeStrokeStyle"
  | "changeArrowhead"
  | "changeArrowType"
  | "changeOpacity"
  | "changeFontSize"
  | "toggleCanvasMenu"
  | "toggleEditMenu"
  | "undo"
  | "redo"
  | "finalize"
  | "changeProjectName"
  | "changeExportBackground"
  | "changeExportScale"
  | "saveToActiveFile"
  | "saveFileToDisk"
  | "loadScene"
  | "duplicateSelection"
  | "deleteSelectedElements"
  | "changeViewBackgroundColor"
  | "clearCanvas"
  | "zoomIn"
  | "zoomOut"
  | "resetZoom"
  | "zoomToFit"
  | "zoomToFitSelection"
  | "zoomToFitSelectionInViewport"
  | "changeFontFamily"
  | "changeTextAlign"
  | "changeVerticalAlign"
  | "toggleFullScreen"
  | "toggleShortcuts"
  | "group"
  | "ungroup"
  | "changeRoundness"
  | "alignTop"
  | "alignBottom"
  | "alignLeft"
  | "alignRight"
  | "alignVerticallyCentered"
  | "alignHorizontallyCentered"
  | "distributeHorizontally"
  | "distributeVertically"
  | "flipHorizontal"
  | "flipVertical"
  | "viewMode"
  | "exportWithDarkMode"
  | "toggleTheme"
  | "increaseFontSize"
  | "decreaseFontSize"
  | "unbindText"
  | "bindText"
  | "unlockAllElements"
  | "toggleElementLock"
  | "toggleLinearEditor"
  | "toggleEraserTool"
  | "toggleHandTool"
  | "selectAllElementsInFrame"
  | "removeAllElementsFromFrame"
  | "updateFrameRendering"
  | "setFrameAsActiveTool"
  | "createContainerFromText"
  | "wrapTextInContainer"
  | "commandPalette"
  | "autoResize"
  | "elementStats"
  | "searchMenu"
  | "cropEditor"
  | "wrapSelectionInFrame"
  | "toggleShapeSwitch"
  | "togglePolygon";

export type PanelComponentProps = {
  elements: readonly ExcalidrawElement[];
  appState: AppState;
  updateData: <T = any>(formData?: T) => void;
  appProps: ExcalidrawProps;
  data?: Record<string, any>;
  app: AppClassProperties;
  renderAction: (
    name: ActionName,
    data?: PanelComponentProps["data"],
  ) => React.JSX.Element | null;
};

export interface Action {
  name: ActionName;
  label:
    | string
    | ((
        elements: readonly ExcalidrawElement[],
        appState: Readonly<AppState>,
        app: AppClassProperties,
      ) => string);
  keywords?: string[];
  icon?:
    | React.ReactNode
    | ((
        appState: UIAppState,
        elements: readonly ExcalidrawElement[],
      ) => React.ReactNode);
  PanelComponent?: React.FC<PanelComponentProps>;
  perform: ActionFn;
  keyPriority?: number;
  keyTest?: (
    event: React.KeyboardEvent | KeyboardEvent,
    appState: AppState,
    elements: readonly ExcalidrawElement[],
    app: AppClassProperties,
  ) => boolean;
  predicate?: (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    appProps: ExcalidrawProps,
    app: AppClassProperties,
  ) => boolean;
  checked?: (appState: Readonly<AppState>) => boolean;
  trackEvent:
    | false
    | {
        category:
          | "toolbar"
          | "element"
          | "canvas"
          | "export"
          | "history"
          | "menu"
          | "search_menu"
          | "shape_switch";
        action?: string;
        predicate?: (
          appState: Readonly<AppState>,
          elements: readonly ExcalidrawElement[],
          value: any,
        ) => boolean;
      };
  /** if set to `true`, allow action to be performed in viewMode.
   *  Defaults to `false` */
  viewMode?: boolean;
}
