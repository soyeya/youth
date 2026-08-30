import React from 'react';

const Formcontrol = ({ label, htmlFor , required , children , error}) => {

     return(
        <div className="FormControl">
             <label htmlFor={htmlFor}>
                {label}
                {required && <span className="required">*</span>}
             </label>
             {children}
             {error && <div className="error">{error}</div>}
        </div>
     )
}

export default Formcontrol;