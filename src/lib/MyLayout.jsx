import React, { useState, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import Dialog from '../components/Dialong';
import LoadingDialog from '../components/LoadingDialog';

const layoutContext = createContext({});
layoutContext.displayName = "LayoutContext";

export const LayoutControl = ({ children }) => {
  const [dialog, setDialog] = useState();

  return (
    <layoutContext.Provider value={{ dialog, setDialog }}>
      {children}
    </layoutContext.Provider>
  );
};

export const useDialog = () => {
  const { dialog, setDialog } = useContext(layoutContext);
  const openDialog  = (element) => setDialog(element);
  const closeDialog = () => setDialog(null);
  return { dialog, openDialog, closeDialog };
};

/**
 * useLoading
 * startLoading(message) — 시간 경과 피드백이 포함된 LoadingDialog를 띄웁니다.
 * finishLoading()       — 로딩 다이얼로그를 닫습니다.
 */
export const useLoading = () => {
  const { openDialog, closeDialog: finishLoading } = useDialog();
  const startLoading = (message) =>
    openDialog(<LoadingDialog message={message} />);
  return { startLoading, finishLoading };
};

export const DialogContainer = () => {
  const { dialog } = useDialog();
  return (
    <>
      {dialog &&
        createPortal(dialog, document.querySelector('#dialog'))
      }
    </>
  );
};
