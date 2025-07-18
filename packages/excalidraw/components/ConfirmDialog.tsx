import { flushSync } from "react-dom";

import { t } from "../i18n";

import { Dialog } from "./Dialog";
import DialogActionButton from "./DialogActionButton";
import { useExcalidrawContainer, useExcalidrawSetAppState } from "./App";

import "./ConfirmDialog.scss";

import type { DialogProps } from "./Dialog";

interface Props extends Omit<DialogProps, "onCloseRequest"> {
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}
const ConfirmDialog = (props: Props) => {
  const {
    onConfirm,
    onCancel,
    children,
    confirmText = t("buttons.confirm"),
    cancelText = t("buttons.cancel"),
    className = "",
    ...rest
  } = props;
  const setAppState = useExcalidrawSetAppState();
  const { container } = useExcalidrawContainer();

  return (
    <Dialog
      onCloseRequest={onCancel}
      size="small"
      {...rest}
      className={`confirm-dialog ${className}`}
    >
      {children}
      <div className="confirm-dialog-buttons">
        <DialogActionButton
          label={cancelText}
          onClick={() => {
            setAppState({ openMenu: null });
            // flush any pending updates synchronously,
            // otherwise it could lead to crash in some chromium versions (131.0.6778.86),
            // when `.focus` is invoked with container in some intermediate state
            // (container seems mounted in DOM, but focus still causes a crash)
            flushSync(() => {
              onCancel();
            });

            container?.focus();
          }}
        />
        <DialogActionButton
          label={confirmText}
          onClick={() => {
            setAppState({ openMenu: null });
            // flush any pending updates synchronously,
            // otherwise it leads to crash in some chromium versions (131.0.6778.86),
            // when `.focus` is invoked with container in some intermediate state
            // (container seems mounted in DOM, but focus still causes a crash)
            flushSync(() => {
              onConfirm();
            });

            container?.focus();
          }}
          actionType="danger"
        />
      </div>
    </Dialog>
  );
};
export default ConfirmDialog;
