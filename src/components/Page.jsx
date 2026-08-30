import React from 'react';
import * as MyLayout from '../lib/MyLayout';

const Page = ({ header, children , footer}) => {
   

       return(
       <div className="page">
            <header>{ header }</header>
            <main>{ children }</main>
            <footer>{ footer }</footer>
       <MyLayout.DialogContainer />
       </div>
       
       )
}

export default Page;