import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './assets/css/main.css';
import Home from './pages/Home.jsx';
import Job from './pages/menu/Job.jsx';
import Jobdetails from './pages/details/JobDetail.jsx';
import Residence from './pages/menu/Residence.jsx';
import ResidenceDetails from './pages/details/ResidencDetail.jsx';
import Welfare from './pages/menu/Welfare.jsx';
import WelfareDetails from './pages/details/WelfareDetail.jsx';
import EducationDetails from './pages/details/EducationDetail.jsx';
import Eductaion from './pages/menu/Education.jsx';
import Finance from './pages/menu/Finance.jsx';
import FinanceDetails from './pages/details/FinanceDetail.jsx';
import Join from './pages/Join/Join.jsx';
import Login from './pages/Join/Login.jsx';
import * as LayoutControl from './lib/MyLayout.jsx';
import MyList from './pages/MyList.jsx';

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>    
    <LayoutControl.LayoutControl>
       <Routes>
        <Route path={'/'} element={<Home />} />
        <Route path={'/job'} element ={<Job /> } />
        <Route path={'/residence'} element ={<Residence /> } />
        <Route path={'/welfare'} element ={<Welfare />} />
        <Route path={'/education'} element ={<Eductaion />} />
        <Route path={'/finance'} element ={<Finance/>} />
        <Route path={'/join'} element ={<Join/>} />
        <Route path={'/login'} element ={<Login />} />
        <Route path={'/details/job/:values'} element ={<Jobdetails /> } />
        <Route path={'/details/residence/:values'} element ={<ResidenceDetails/> } />
        <Route path={'/details/welfare/:values'} element ={<WelfareDetails/> } />
        <Route path={'/details/education/:values'} element ={<EducationDetails /> } />
        <Route path={'/details/finance/:name/:values'} element ={<FinanceDetails /> } />
        <Route path={'/myList'} element ={<MyList /> } />
       </Routes>
       </LayoutControl.LayoutControl>
    </BrowserRouter>

  );
}

export default App;
