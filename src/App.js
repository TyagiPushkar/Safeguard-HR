import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from './components/auth/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import theme from './styles/theme';
import Employee from './pages/Employee';
import Holiday from './pages/Holiday';
import Policy from './pages/Policy';
import Attendance from './pages/Attendance';
import Notification from './pages/Notification';
import Leave from './pages/Leave';
import Expense from './pages/Expense';
import EmpProfile from './pages/User';
import PrivateRoute from './components/auth/PrivateRoute';
import Assets from './pages/Assets';
import EmployeeProfile from './pages/EmployeeProfile';
import Visit from './pages/Dealer';
import Registration from './pages/Registration';
import VisitReport from './pages/VisitReport';
import Maps from './pages/Maps';
import Ticket from './pages/Ticket';
import Travel from './pages/Travel';
import Checkpoints from './pages/Checkpoints';
import Menus from './pages/Menus';
import HRMSLayout from './styles/HRMSLayout';
import EmployeeSalarySlip from './components/employee/EmployeeSalarySlip';
import Regularise from './pages/Regularise';
import Docket from './pages/Docket';

function App() {
   useEffect(() => {
        const handleRightClick = (event) => {
            event.preventDefault();
        };

        document.addEventListener('contextmenu', handleRightClick);

        return () => {
            document.removeEventListener('contextmenu', handleRightClick);
        };
    }, []);
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<PrivateRoute element={Dashboard} />} />
            <Route path="/employees" element={<PrivateRoute element={Employee} requiredRole="HR" />} />
            <Route path="/employees/:empId" element={<PrivateRoute element={EmployeeProfile} requiredRole="HR" />} />
            <Route path="/holiday" element={<PrivateRoute element={Holiday} />} />
            <Route path="/policy" element={<PrivateRoute element={Policy} />} />
            <Route path="/attendance" element={<PrivateRoute element={Attendance} />} />
            <Route path="/notification" element={<PrivateRoute element={Notification} />} />
            <Route path="/leave" element={<PrivateRoute element={Leave} />} />
            <Route path="/expense" element={<PrivateRoute element={Expense} />} />
            <Route path="/profile" element={<PrivateRoute element={EmpProfile} />} />
            <Route path="/visit" element={<PrivateRoute element={Visit} />} />
            <Route path="/plan-visit" element={<PrivateRoute element={Visit} />} />
            <Route path="/registration" element={<PrivateRoute element={Registration} />} />
            <Route path="/report" element={<PrivateRoute element={VisitReport} />} />
            <Route path="/maps" element={<PrivateRoute element={Maps} />} />
            <Route path="/live-track" element={<PrivateRoute element={Maps} />} />
            <Route path="/assets" element={<PrivateRoute element={Assets} />} />
            <Route path="/tickets" element={<PrivateRoute element={Ticket} />} />
            <Route path="/travel" element={<PrivateRoute element={Travel} />} />
            <Route path="/regularise" element={<PrivateRoute element={Regularise} requiredRole="HR"/>} />

            <Route path="/checkpoints" element={<PrivateRoute element={Checkpoints} />} />
            <Route path="/add-checkpoint" element={<PrivateRoute element={Checkpoints} />} />
            <Route path="/menus" element={<PrivateRoute element={Menus} />} />
            <Route path="/add-menu" element={<PrivateRoute element={Menus} />} />
            <Route path="/docket" element={<PrivateRoute element={Docket} />} />
            {/* <Route path="/salary-slip/:EmpId" element={<EmployeeSalarySlip />} /> */}
            {/* <Route path="/hrms" element={<PrivateRoute element={HRMSLayout} />} /> */}
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
