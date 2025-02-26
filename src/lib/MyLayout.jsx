import React, { useState, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import Dialog from '../components/Dialong';


const layoutContext = createContext({});
layoutContext.displayName = "LayoutContext";

export const LayoutControl = ({children}) => {

    const [ dialog, setDialog ] = useState();

     return(
    <layoutContext.Provider value={{  dialog, setDialog }}>
        {children}
    </layoutContext.Provider>
         
     );
}


export const useDialog = () => {
     const { dialog, setDialog } = useContext(layoutContext);
     const openDialog = (element) => setDialog (element);
     const closeDialog = () => setDialog (null);
     return { dialog, openDialog, closeDialog };
};

export const useLoading = () => {

    const { openDialog , closeDialog : finishLoading } = useDialog();
    const startLoading = (message) => openDialog(<Dialog>{message}</Dialog>);
    return { startLoading, finishLoading }
}

export const DialogContainer = () => {
     const { dialog } = useDialog(); 
     return(
        <>
        {dialog && 
          createPortal(dialog, document.querySelector("#dialog"))
         }
        </>
     )
}
