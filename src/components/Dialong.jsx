import React  , { useRef, useEffect  }from 'react';

const Dialog = ( { header, children , footer }) => {

     const footerRef = useRef(null);
     useEffect(() => {
        if(!footerRef.current) return;
     },[footerRef.current])
     return(
         <div className="dialog">
             <div className="dialogBox">
             {header && <header>{header}</header>}
             <main>{children}</main>
             {footer && <footer ref={footerRef}>{footer}</footer>}
             </div>
         </div>
     )
}

export default Dialog;