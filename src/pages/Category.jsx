import React from 'react';
import { Link } from 'react-router-dom';
import categroyDB from '../json/category.json';
import categoryImg01 from '../assets/img/job.png';
import categoryImg02 from '../assets/img/finance.png';
import categoryImg03 from '../assets/img/residence.png';
import categoryImg04 from '../assets/img/welfare.png';
import categoryImg05 from '../assets/img/education.png';


const Category = ({ login }) => {

   const Imgobj = [
       categoryImg01,
       categoryImg02,
       categoryImg03,
       categoryImg04,
       categoryImg05
   ]

     return(
        <div className="category">
           <h3><span>Category</span>관심사를 클릭해주세요</h3>
            <ul>
              {categroyDB.category.map((v,i) => (
                <li key={'category' + i}><Link to={ login ? `/home${v.href}` : v.href}><img src={Imgobj[i]} alt={`icon${i+1}`}/>{v.title}</Link></li>
              ))}
           </ul>
        </div>
     )
}

export default Category;