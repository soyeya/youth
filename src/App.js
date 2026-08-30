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
import Education from './pages/menu/Education.jsx';
import Finance from './pages/menu/Finance.jsx';
import FinanceDetails from './pages/details/FinanceDetail.jsx';
import LhList from './pages/menu/Lh.jsx';
import LhDetail from './pages/details/LhDetail.jsx';
import ShList from './pages/menu/Sh.jsx';
import ShDetail from './pages/details/ShDetail.jsx';
import Join from './pages/Join/Join.jsx';
import Login from './pages/Join/Login.jsx';
import * as LayoutControl from './lib/MyLayout.jsx';
import MyList from './pages/MyList.jsx';
import MyPage from './pages/MyPage.jsx';

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <LayoutControl.LayoutControl>
        <Routes>
          <Route path={'/'} element={<Home />} />
          <Route path={'/job'} element={<Job />} />
          <Route path={'/residence'} element={<Residence />} />
          <Route path={'/welfare'} element={<Welfare />} />
          <Route path={'/education'} element={<Education />} />
          <Route path={'/finance'} element={<Finance />} />
          <Route path={'/lh'} element={<LhList />} />
          <Route path={'/sh'} element={<ShList />} />
          <Route path={'/join'} element={<Join />} />
          <Route path={'/login'} element={<Login />} />
          <Route path={'/mypage'} element={<MyPage />} />
          <Route path={'/details/job/*'} element={<Jobdetails />} />
          <Route path={'/details/residence/*'} element={<ResidenceDetails />} />
          <Route path={'/details/welfare/*'} element={<WelfareDetails />} />
          <Route path={'/details/education/*'} element={<EducationDetails />} />
          <Route path={'/details/finance/:name/:values'} element={<FinanceDetails />} />
          <Route path={'/details/lh/:panId'} element={<LhDetail />} />
          <Route path={'/details/sh/:panId'} element={<ShDetail />} />
          <Route path={'/myList'} element={<MyList />} />
        </Routes>
      </LayoutControl.LayoutControl>
    </BrowserRouter>
  );
}

export default App;
