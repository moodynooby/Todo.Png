import { THEME } from "@excalidraw/common";

import type { Theme } from "@excalidraw/element/types";

import {
  actionClearCanvas,
  actionToggleSearchMenu,
  actionToggleTheme,
} from "../../actions";
import { getShortcutFromShortcutName } from "../../actions/shortcuts";
import { trackEvent } from "../../analytics";
import { useUIAppState } from "../../context/ui-appState";
import { useSetAtom } from "../../editor-jotai";
import { useI18n } from "../../i18n";
import { activeConfirmDialogAtom } from "../ActiveConfirmDialog";
import {
  useExcalidrawSetAppState,
  useExcalidrawActionManager,
  useExcalidrawElements,
  useAppProps,
} from "../App";
import { openConfirmModal } from "../OverwriteConfirm/OverwriteConfirmState";
import Trans from "../Trans";
import DropdownMenuItem from "../dropdownMenu/DropdownMenuItem";
import DropdownMenuItemContentRadio from "../dropdownMenu/DropdownMenuItemContentRadio";
import {
  boltIcon,
  DeviceDesktopIcon,
  ExportIcon,
  ExportImageIcon,
  LoadIcon,
  MoonIcon,
  save,
  searchIcon,
  SunIcon,
  TrashIcon,
} from "../icons";

import "./DefaultItems.scss";

export const SaveAsImage = () => {
  const setAppState = useExcalidrawSetAppState();
  const { t } = useI18n();
  return (
    <DropdownMenuItem
      icon={ExportImageIcon}
      data-testid="image-export-button"
      onSelect={() => setAppState({ openDialog: { name: "imageExport" } })}
      shortcut={getShortcutFromShortcutName("imageExport")}
      aria-label={t("buttons.exportImage")}
    >
      {t("buttons.exportImage")}
    </DropdownMenuItem>
  );
};
SaveAsImage.displayName = "SaveAsImage";

export const CommandPalette = (opts?: { className?: string }) => {
  const setAppState = useExcalidrawSetAppState();
  const { t } = useI18n();

  return (
    <DropdownMenuItem
      icon={boltIcon}
      data-testid="command-palette-button"
      onSelect={() => {
        trackEvent("command_palette", "open", "menu");
        setAppState({ openDialog: { name: "commandPalette" } });
      }}
      shortcut={getShortcutFromShortcutName("commandPalette")}
      aria-label={t("commandPalette.title")}
      className={opts?.className}
    >
      {t("commandPalette.title")}
    </DropdownMenuItem>
  );
};
CommandPalette.displayName = "CommandPalette";

export const SearchMenu = (opts?: { className?: string }) => {
  const { t } = useI18n();
  const actionManager = useExcalidrawActionManager();

  return (
    <DropdownMenuItem
      icon={searchIcon}
      data-testid="search-menu-button"
      onSelect={() => {
        actionManager.executeAction(actionToggleSearchMenu);
      }}
      shortcut={getShortcutFromShortcutName("searchMenu")}
      aria-label={t("search.title")}
      className={opts?.className}
    >
      {t("search.title")}
    </DropdownMenuItem>
  );
};
SearchMenu.displayName = "SearchMenu";

export const ClearCanvas = () => {
  const { t } = useI18n();

  const setActiveConfirmDialog = useSetAtom(activeConfirmDialogAtom);
  const actionManager = useExcalidrawActionManager();

  if (!actionManager.isActionEnabled(actionClearCanvas)) {
    return null;
  }

  return (
    <DropdownMenuItem
      icon={TrashIcon}
      onSelect={() => setActiveConfirmDialog("clearCanvas")}
      data-testid="clear-canvas-button"
      aria-label={t("buttons.clearReset")}
    >
      {t("buttons.clearReset")}
    </DropdownMenuItem>
  );
};
ClearCanvas.displayName = "ClearCanvas";

export const ToggleTheme = (
  props:
    | {
        allowSystemTheme: true;
        theme: Theme | "system";
        onSelect: (theme: Theme | "system") => void;
      }
    | {
        allowSystemTheme?: false;
        onSelect?: (theme: Theme) => void;
      },
) => {
  const { t } = useI18n();
  const appState = useUIAppState();
  const actionManager = useExcalidrawActionManager();
  const shortcut = getShortcutFromShortcutName("toggleTheme");

  if (!actionManager.isActionEnabled(actionToggleTheme)) {
    return null;
  }

  if (props?.allowSystemTheme) {
    return (
      <DropdownMenuItemContentRadio
        name="theme"
        value={props.theme}
        onChange={(value: Theme | "system") => props.onSelect(value)}
        choices={[
          {
            value: THEME.LIGHT,
            label: SunIcon,
            ariaLabel: `${t("buttons.lightMode")} - ${shortcut}`,
          },
          {
            value: THEME.DARK,
            label: MoonIcon,
            ariaLabel: `${t("buttons.darkMode")} - ${shortcut}`,
          },
          {
            value: "system",
            label: DeviceDesktopIcon,
            ariaLabel: t("buttons.systemMode"),
          },
        ]}
      >
        {t("labels.theme")}
      </DropdownMenuItemContentRadio>
    );
  }

  return (
    <DropdownMenuItem
      onSelect={(event) => {
        // do not close the menu when changing theme
        event.preventDefault();

        if (props?.onSelect) {
          props.onSelect(
            appState.theme === THEME.DARK ? THEME.LIGHT : THEME.DARK,
          );
        } else {
          return actionManager.executeAction(actionToggleTheme);
        }
      }}
      icon={appState.theme === THEME.DARK ? SunIcon : MoonIcon}
      data-testid="toggle-dark-mode"
      shortcut={shortcut}
      aria-label={
        appState.theme === THEME.DARK
          ? t("buttons.lightMode")
          : t("buttons.darkMode")
      }
    >
      {appState.theme === THEME.DARK
        ? t("buttons.lightMode")
        : t("buttons.darkMode")}
    </DropdownMenuItem>
  );
};
ToggleTheme.displayName = "ToggleTheme";

export const ChangeCanvasBackground = () => {
  const { t } = useI18n();
  const appState = useUIAppState();
  const actionManager = useExcalidrawActionManager();
  const appProps = useAppProps();

  if (
    appState.viewModeEnabled ||
    !appProps.UIOptions.canvasActions.changeViewBackgroundColor
  ) {
    return null;
  }
  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div
        data-testid="canvas-background-label"
        style={{ fontSize: ".75rem", marginBottom: ".5rem" }}
      >
        {t("labels.canvasBackground")}
      </div>
      <div style={{ padding: "0 0.625rem" }}>
        {actionManager.renderAction("changeViewBackgroundColor")}
      </div>
    </div>
  );
};
ChangeCanvasBackground.displayName = "ChangeCanvasBackground";

export const Export = () => {
  const { t } = useI18n();
  const setAppState = useExcalidrawSetAppState();
  return (
    <DropdownMenuItem
      icon={ExportIcon}
      onSelect={() => {
        setAppState({ openDialog: { name: "jsonExport" } });
      }}
      data-testid="json-export-button"
      aria-label={t("buttons.export")}
    >
      {t("buttons.export")}
    </DropdownMenuItem>
  );
};
Export.displayName = "Export";
