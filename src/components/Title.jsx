import React from 'react';
import { Link } from 'react-router-dom';

const Title = ({ title , backURL , color }) => {

     if(backURL){
         return(
            <div className="title active">
                 <Link to={backURL}/>
                 <h3>{title}</h3>
            </div>
         )
     }
     return(
         <div className={color ? "title color" : "title"}>
            <h3>{title}</h3>
         </div>
     )
}

export default Title;
