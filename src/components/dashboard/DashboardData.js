import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AccessTime,
  CalendarMonth,
  CheckCircle,
  Computer,
  CurrencyRupee,
  Dashboard,
  DonutLarge,
  EventAvailable,
  ExpandMore,
  Healing,
  HourglassEmpty,
  Laptop,
  LocalAtm,
  LocationOn,
  MoreVert,
  Notifications,
  Person,
  Receipt,
  Refresh,
  Settings,
  Today,
  TrendingUp,
  Work,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { format, parseISO, isValid, parse } from 'date-fns';

// Custom components
const StatCard = ({ icon, title, value, color, subtitle, progress }) => {
  const theme = useTheme();
  
  return (
    <Card 
      component={motion.div}
      whileHover={{ 
        translateY: -5,
        boxShadow: theme.shadows[10],
        transition: { duration: 0.2 }
      }}
      sx={{ 
        height: '100%',
        borderLeft: `4px solid ${color}`,
        transition: 'all 0.3s ease'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color: color }}>
            {icon}
          </Avatar>
        </Box>
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8, 
                borderRadius: 5,
                backgroundColor: `${color}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color
                }
              }} 
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const DashboardData = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [leaveDetails, setLeaveDetails] = useState(null);
  const [expenseDetails, setExpenseDetails] = useState([]);
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [assetDetails, setAssetDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const EmpId = user.emp_id;

  // Calculate statistics
  const calculateStats = () => {
    // Attendance stats
    const presentDays = attendanceDetails.filter(day => day.firstIn !== 'N/A').length;
    const totalDays = attendanceDetails.length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    
    // On-time stats
    const onTimeDays = attendanceDetails.filter(day => {
      if (day.firstIn === 'N/A') return false;
      
      // Parse time and compare with shift start time (assuming 9:00 AM)
      const timeStr = day.firstIn;
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      
      // Convert to 24-hour format
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      
      // Check if on time (before 9:10 AM)
      return (hour24 < 10) || (hour24 === 10 && minutes <= 10);
    }).length;
    
    const punctualityRate = presentDays > 0 ? (onTimeDays / presentDays) * 100 : 0;
    
    // Leave stats
    const leaveBalance = {
      sick: leaveDetails?.SL || 0,
      casual: leaveDetails?.CL || 0,
      earned: leaveDetails?.EL || 0,
      total: (leaveDetails?.SL || 0) + (leaveDetails?.CL || 0) + (leaveDetails?.EL || 0)
    };
    
    // Expense stats
    const totalExpense = expenseDetails.reduce((sum, expense) => sum + parseFloat(expense.expenseAmount || 0), 0);
    const pendingExpense = expenseDetails
      .filter(expense => expense.Status === 'Pending')
      .reduce((sum, expense) => sum + parseFloat(expense.expenseAmount || 0), 0);
    
    // Asset stats
    const assetCount = assetDetails.length;
    
    return {
      attendance: {
        presentDays,
        totalDays,
        attendanceRate,
        onTimeDays,
        punctualityRate
      },
      leave: leaveBalance,
      expense: {
        total: totalExpense,
        pending: pendingExpense,
        approved: totalExpense - pendingExpense,
        count: expenseDetails.length
      },
      asset: {
        count: assetCount
      }
    };
  };

  const stats = calculateStats();

  // Prepare chart data
  const leaveChartData = [
    { name: 'Sick', value: stats.leave.sick, color: theme.palette.error.main },
    { name: 'Casual', value: stats.leave.casual, color: theme.palette.primary.main },
    { name: 'Earned', value: stats.leave.earned, color: theme.palette.success.main }
  ];

  const expenseChartData = [
    { name: 'Approved', value: stats.expense.approved, color: theme.palette.success.main },
    { name: 'Pending', value: stats.expense.pending, color: theme.palette.warning.main }
  ];

  const attendanceChartData = attendanceDetails.slice(0, 7).map(day => {
    const date = day.date;
    const hours = parseFloat(day.workingHours) || 0;
    
    return {
      date: date,
      hours: hours,
      color: hours >= 8 ? theme.palette.success.main : theme.palette.warning.main
    };
  }).reverse();

  useEffect(() => {
    fetchData();
  }, [EmpId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const responses = await Promise.all([
        axios.get(`https://namami-infotech.com/SAFEGUARD/src/employee/view_employee.php?EmpId=${EmpId}`),
        axios.get(`https://namami-infotech.com/SAFEGUARD/src/leave/balance_leave.php?empid=${EmpId}`),
        axios.get(`https://namami-infotech.com/SAFEGUARD/src/expense/get_expense.php?EmpId=${EmpId}`),
        axios.get(`https://namami-infotech.com/SAFEGUARD/src/attendance/view_attendance.php?EmpId=${EmpId}`),
        axios.get(`https://namami-infotech.com/SAFEGUARD/src/assets/get_issue_asset.php?EmpId=${EmpId}`)
      ]);

      setEmployeeData(responses[0].data.data);
      setLeaveDetails(responses[1].data.data);
      setExpenseDetails(responses[2].data.data || []);
      setAttendanceDetails(responses[3].data.data || []);
      setAssetDetails(responses[4].data.data || []);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading your dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Refresh />} 
          onClick={handleRefresh}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto', p: { xs: 0, md: 0 }, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header with Profile */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          background: "#8d0638ff",
          color: 'white'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Avatar 
                  src={employeeData?.Pic} 
                  sx={{ 
                    width: { xs: 80, md: 100 }, 
                    height: { xs: 80, md: 100 },
                    border: '4px solid white'
                  }} 
                />
              </motion.div>
              <Box sx={{ ml: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {employeeData?.Name || 'N/A'}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {employeeData?.Designation || 'N/A'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip 
                    icon={<Person sx={{ color: 'white !important' }} />} 
                    label={`ID: ${employeeData?.EmpId || 'N/A'}`} 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      mr: 1
                    }} 
                  />
                  {/* <Chip 
                    icon={<Work sx={{ color: 'white !important' }} />} 
                    label={`Dept: ${employeeData?.Department || 'N/A'}`} 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      mr: 1
                    }} 
                  />
                  <Chip 
                    icon={<LocationOn sx={{ color: 'white !important' }} />} 
                    label={employeeData?.Location || 'N/A'} 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white'
                    }} 
                  /> */}
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
              <Button 
                variant="contained" 
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } 
                }}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              {/* <Button 
                variant="contained" 
                startIcon={<Settings />}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } 
                }}
              >
                Settings
              </Button> */}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Overview */}


      {/* <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<DonutLarge />}
            title="Attendance Rate"
            value={`${stats.attendance.attendanceRate.toFixed(0)}%`}
            color={theme.palette.primary.main}
            subtitle={`${stats.attendance.presentDays}/${stats.attendance.totalDays} days present`}
            progress={stats.attendance.attendanceRate}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<EventAvailable />}
            title="Leave Balance"
            value={stats.leave.total}
            color={theme.palette.success.main}
            subtitle="Total available leaves"
            progress={(stats.leave.total / 30) * 100} // Assuming max 30 leaves
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<LocalAtm />}
            title="Total Expenses"
            value={`₹${stats.expense.total.toFixed(0)}`}
            color={theme.palette.warning.main}
            subtitle={`${stats.expense.count} expense claims`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<Computer />}
            title="Assets Assigned"
            value={stats.asset.count}
            color={theme.palette.info.main}
            subtitle="Company assets in use"
          />
        </Grid>
      </Grid> */}

      {/* Tabs Section */}
      <Paper elevation={2} sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              py: 2
            }
          }}
        >
          <Tab 
            label="Dashboard" 
            icon={<Dashboard />} 
            iconPosition="start"
          />
          <Tab 
            label="Attendance" 
            icon={<AccessTime />} 
            iconPosition="start"
          />
          <Tab 
            label="Leave" 
            icon={<EventAvailable />} 
            iconPosition="start"
          />
          <Tab 
            label="Expense" 
            icon={<Receipt />} 
            iconPosition="start"
          />
          <Tab 
            label="Assets" 
            icon={<Laptop />} 
            iconPosition="start"
          />
        </Tabs>

        {/* Dashboard Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Recent Attendance */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '100%' }}>
                <CardHeader 
                  title="Recent Attendance" 
                  action={
                    <IconButton>
                      <MoreVert />
                    </IconButton>
                  }
                />
                <Divider />
                <CardContent>
                  <Box sx={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceChartData}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip 
                          formatter={(value) => [`${value} hours`, 'Working Hours']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Bar dataKey="hours" name="Working Hours">
                          {attendanceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Last 7 Days Summary
                    </Typography>
                    {/* <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CheckCircle sx={{ color: theme.palette.success.main, mr: 1 }} fontSize="small" />
                          <Typography variant="body2">
                            On Time: {stats.attendance.onTimeDays} days
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <HourglassEmpty sx={{ color: theme.palette.warning.main, mr: 1 }} fontSize="small" />
                          <Typography variant="body2">
                            Late: {stats.attendance.presentDays - stats.attendance.onTimeDays} days
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid> */}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Leave Balance */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardHeader 
                  title="Leave Balance" 
                  action={
                    <IconButton>
                      <MoreVert />
                    </IconButton>
                  }
                />
                <Divider />
                <CardContent>
                  <Box sx={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leaveChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {leaveChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color={theme.palette.error.main}>
                            {stats.leave.sick}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Sick Leave
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color={theme.palette.primary.main}>
                            {stats.leave.casual}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Casual Leave
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color={theme.palette.success.main}>
                            {stats.leave.earned}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Earned Leave
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Expenses */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Recent Expenses" 
                  action={
                    <IconButton>
                      <MoreVert />
                    </IconButton>
                  }
                />
                <Divider />
                <CardContent sx={{ p: 0 }}>
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {expenseDetails.slice(0, 5).map((expense, index) => (
                      <React.Fragment key={expense.detailId || index}>
                        <ListItem
                          secondaryAction={
                            <Chip 
                              label={expense.Status} 
                              color={expense.Status === 'Approved' ? 'success' : expense.Status === 'Rejected' ? 'error' : 'warning'} 
                              size="small" 
                            />
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                              <CurrencyRupee />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body1" fontWeight="medium">
                                {expense.expenseType} - ₹{expense.expenseAmount}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {expense.expenseDate}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < expenseDetails.length - 1 && <Divider variant="inset" component="li" />}
                      </React.Fragment>
                    ))}
                    {expenseDetails.length === 0 && (
                      <ListItem>
                        <ListItemText 
                          primary="No expense records found" 
                          secondary="Submit your first expense claim" 
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Asset Summary */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Assigned Assets" 
                  action={
                    <IconButton>
                      <MoreVert />
                    </IconButton>
                  }
                />
                <Divider />
                <CardContent sx={{ p: 0 }}>
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {assetDetails.slice(0, 5).map((asset, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                              <Laptop />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body1" fontWeight="medium">
                                {asset.asset_name}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {asset.make_name} {asset.model_name}
                              </Typography>
                            }
                          />
                          <Tooltip title="Serial Number">
                            <Chip 
                              label={asset.serial_number} 
                              size="small" 
                              variant="outlined" 
                            />
                          </Tooltip>
                        </ListItem>
                        {index < assetDetails.length - 1 && <Divider variant="inset" component="li" />}
                      </React.Fragment>
                    ))}
                    {assetDetails.length === 0 && (
                      <ListItem>
                        <ListItemText 
                          primary="No assets assigned" 
                          secondary="Contact IT department for equipment" 
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Attendance Tab */}
        <TabPanel value={activeTab} index={1}>
          <Card>
            <CardHeader 
              title="Attendance History" 
              subheader="Your recent attendance records"
              action={
                <Button 
                  variant="outlined" 
                  startIcon={<CalendarMonth />}
                  size="small"
                >
                  View Calendar
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Check In</TableCell>
                      <TableCell>Check Out</TableCell>
                      <TableCell>Working Hours</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceDetails.map((day, index) => {
                      const isOnTime = day.firstIn !== 'N/A' && compareTimes(day.firstIn, '10:00 AM');
                      
                      return (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Today fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                              {day.date}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {day.firstIn !== 'N/A' ? (
                                <>
                                  <AccessTime fontSize="small" sx={{ mr: 1, color: isOnTime ? theme.palette.success.main : theme.palette.error.main }} />
                                  {day.firstIn}
                                </>
                              ) : 'N/A'}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {day.lastOut !== 'N/A' ? (
                                <>
                                  <AccessTime fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                                  {day.lastOut}
                                </>
                              ) : 'N/A'}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight="medium">
                              {day.workingHours} hrs
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={day.firstIn !== 'N/A' ? (isOnTime ? 'On Time' : 'Late') : 'Absent'} 
                              color={day.firstIn !== 'N/A' ? (isOnTime ? 'success' : 'warning') : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {attendanceDetails.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body1" sx={{ py: 3 }}>
                            No attendance records found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Leave Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Leave Balance" />
                <Divider />
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Sick Leave
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ flexGrow: 1, mr: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={(leaveDetails?.SL / 12) * 100} 
                          sx={{ 
                            height: 10, 
                            borderRadius: 5,
                            backgroundColor: `${theme.palette.error.light}30`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: theme.palette.error.main
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {leaveDetails?.SL || 0}/12
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Healing fontSize="small" sx={{ color: theme.palette.error.main, mr: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        For health-related absences
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Casual Leave
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ flexGrow: 1, mr: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={(leaveDetails?.CL / 12) * 100} 
                          sx={{ 
                            height: 10, 
                            borderRadius: 5,
                            backgroundColor: `${theme.palette.primary.light}30`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: theme.palette.primary.main
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {leaveDetails?.CL || 0}/12
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Today fontSize="small" sx={{ color: theme.palette.primary.main, mr: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        For personal matters
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Earned Leave
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ flexGrow: 1, mr: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={(leaveDetails?.EL / 15) * 100} 
                          sx={{ 
                            height: 10, 
                            borderRadius: 5,
                            backgroundColor: `${theme.palette.success.light}30`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: theme.palette.success.main
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {leaveDetails?.EL || 0}/15
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUp fontSize="small" sx={{ color: theme.palette.success.main, mr: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Accumulated based on service
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader 
                  title="Leave Applications" 
                  action={
                    <Button 
                      variant="contained" 
                      size="small"
                      startIcon={<EventAvailable />}
                    >
                      Apply Leave
                    </Button>
                  }
                />
                <Divider />
                <CardContent>
                  <Typography variant="body1" sx={{ py: 3, textAlign: 'center' }}>
                    Your recent leave applications will appear here
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Expense Tab */}
        <TabPanel value={activeTab} index={3}>
          <Card>
            <CardHeader 
              title="Expense Claims" 
              subheader="Your expense reimbursement requests"
              action={
                <Button 
                  variant="contained" 
                  size="small"
                  startIcon={<Receipt />}
                >
                  New Claim
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenseDetails.map((expense, index) => (
                      <TableRow key={expense.detailId || index} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Receipt fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                            {expense.expenseType}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="medium">
                            ₹{expense.expenseAmount}
                          </Typography>
                        </TableCell>
                        <TableCell>{expense.expenseDate}</TableCell>
                        <TableCell>
                          <Chip 
                            label={expense.Status} 
                            color={expense.Status === 'Approved' ? 'success' : expense.Status === 'Rejected' ? 'error' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {expenseDetails.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body1" sx={{ py: 3 }}>
                            No expense claims found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Assets Tab */}
        <TabPanel value={activeTab} index={4}>
          <Card>
            <CardHeader 
              title="Assigned Assets" 
              subheader="Company assets issued to you"
            />
            <Divider />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell>Make</TableCell>
                      <TableCell>Model</TableCell>
                      <TableCell>Serial Number</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assetDetails.map((asset, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Laptop fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                            {asset.asset_name}
                          </Box>
                        </TableCell>
                        <TableCell>{asset.make_name}</TableCell>
                        <TableCell>{asset.model_name}</TableCell>
                        <TableCell>
                          <Typography fontWeight="medium">
                            {asset.serial_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label="Active" 
                            color="success"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {assetDetails.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body1" sx={{ py: 3 }}>
                            No assets assigned
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
    </Box>
  );
};

// Helper function to determine if check-in time is on time
const compareTimes = (checkInTime, shiftStartTime) => {
  if (checkInTime === 'N/A') return false;
  
  // Parse times (assuming format like "9:00 AM")
  const [checkInHour, checkInMinute] = checkInTime.split(':');
  const checkInHourNum = parseInt(checkInHour, 10);
  const checkInMinuteNum = parseInt(checkInMinute.split(' ')[0], 10);
  const checkInPeriod = checkInTime.split(' ')[1];
  
  const [shiftHour, shiftMinute] = shiftStartTime.split(':');
  const shiftHourNum = parseInt(shiftHour, 10);
  const shiftMinuteNum = parseInt(shiftMinute.split(' ')[0], 10);
  const shiftPeriod = shiftStartTime.split(' ')[1];
  
  // Convert to 24-hour format
  let checkIn24Hour = checkInHourNum;
  if (checkInPeriod === 'PM' && checkInHourNum !== 12) checkIn24Hour += 12;
  if (checkInPeriod === 'AM' && checkInHourNum === 12) checkIn24Hour = 0;
  
  let shift24Hour = shiftHourNum;
  if (shiftPeriod === 'PM' && shiftHourNum !== 12) shift24Hour += 12;
  if (shiftPeriod === 'AM' && shiftHourNum === 12) shift24Hour = 0;
  
  // Compare times
  if (checkIn24Hour < shift24Hour) return true;
  if (checkIn24Hour === shift24Hour && checkInMinuteNum <= shiftMinuteNum + 10) return true;
  return false;
};

export default DashboardData;
