import { trackEvent } from "./../analytics";
import { t } from "./../i18n";
import { useExcalidrawSetAppState } from "./App";
import { boltIcon } from "./icons";

import { ToolButton } from "./ToolButton";

export const CommandButton = (opts?: { className?: string }) => {
  const setAppState = useExcalidrawSetAppState();

  return (
    <ToolButton
      type="icon"
      icon={boltIcon}
      data-testid="command-palette-button"
      onClick={() => {
        trackEvent("command_palette", "open", "menu");
        setAppState({ openDialog: { name: "commandPalette" } });
      }}
      aria-label={t("commandPalette.title")}
      className={opts?.className}
    />
  );
};
