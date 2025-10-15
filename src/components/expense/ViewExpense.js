'use client'

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TableFooter,
  TablePagination,
  Button,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Tooltip,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  Skeleton,
  MenuItem
} from '@mui/material';
import {
  Check,
  Cancel,
  Search,
  GetApp,
  Visibility,
  AttachMoney,
  CheckCircle,
  Error as ErrorIcon,
  Pending,
  Download
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

// Color palette
const COLORS = {
  primary: '#8d0638ff',
  secondary: '#667eea',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#f8fafc',
  surface: '#ffffff'
};

// Compact Stats Card Component
const StatsCard = ({ icon, title, value, color }) => {
  return (
    <Card
      component={motion.div}
      whileHover={{ scale: 1.02, y: -2 }}
      sx={{
        height: '100%',
        background: COLORS.surface,
        border: 'none',
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        minHeight: 100
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: `${color}15`, 
              color: color, 
              width: 48, 
              height: 48,
              borderRadius: 2
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold" color={color} sx={{ mt: 0.5 }}>
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

function EnhancedViewExpense() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [expenses, setExpenses] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await axios.get(
          'https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php',
          { params: { Tenent_Id: user.tenent_id } }
        );

        if (response.data.success) {
          const filteredEmployees = response.data.data.filter(
            emp => emp.Tenent_Id === user.tenent_id
          );
          setEmployeeData(filteredEmployees);
        } else {
          setError(response.data.message);
        }
      } catch (error) {
        setError('Error fetching employee data');
        console.error('Error:', error);
      }
    };

    fetchEmployeeData();
  }, [user.tenent_id]);

  useEffect(() => {
    const fetchExpenses = async () => {
      if (employeeData.length === 0) return;

      try {
        if (!user || !user.emp_id) {
          setError('User is not authenticated');
          setLoading(false);
          return;
        }

        const response = await axios.get(
          'https://namami-infotech.com/SAFEGUARD/src/expense/get_expense.php',
          { params: { EmpId: user.emp_id, role: user.role } }
        );

        if (response.data.success) {
          const filteredExpenses = response.data.data.filter(expense =>
            employeeData.some(emp => emp.EmpId === expense.empId && emp.Tenent_Id === user.tenent_id)
          );

          const expenseData = filteredExpenses.map(expense => {
            const employee = employeeData.find(emp => emp.EmpId === expense.empId);
            return {
              ...expense,
              employeeName: employee ? employee.Name : 'Unknown'
            };
          });

          setExpenses(expenseData);
        } else {
          setError(response.data.message);
        }
      } catch (error) {
        setError('Error fetching expense data');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [user, employeeData, user.tenent_id]);

  const handleStatusChange = async (detailId, status) => {
    try {
      const response = await axios.post(
        'https://namami-infotech.com/SAFEGUARD/src/expense/update_expense.php',
        { detailId, status, role: user.role }
      );

      if (response.data.success) {
        setExpenses(prevExpenses =>
          prevExpenses.map(expense =>
            expense.detailId === detailId ? { ...expense, Status: status } : expense
          )
        );
        setSnackbar({
          open: true,
          message: `Expense ${status.toLowerCase()} successfully!`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: response.data.message,
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error updating expense status',
        severity: 'error'
      });
    }
  };

  const handleViewImage = (base64Data) => {
    if (!base64Data.startsWith('data:image/')) {
      base64Data = `data:image/png;base64,${base64Data}`;
    }
    setSelectedImage(base64Data);
    setImageDialogOpen(true);
  };

  const exportToCsv = () => {
    const csvRows = [
      ['Employee Name', 'Expense Date', 'Expense Type', 'Expense Amount', 'Status']
    ];

    filteredExpenses.forEach(({ employeeName, expenseDate, expenseType, expenseAmount, Status }) => {
      csvRows.push([
        employeeName,
        formatDate(expenseDate),
        expenseType,
        expenseAmount,
        Status
      ]);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return COLORS.success;
      case 'Rejected': return COLORS.error;
      case 'Pending': return COLORS.warning;
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle fontSize="small" />;
      case 'Rejected': return <ErrorIcon fontSize="small" />;
      case 'Pending': return <Pending fontSize="small" />;
      default: return <Pending fontSize="small" />;
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.expenseType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || expense.Status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatistics = () => {
    const total = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.expenseAmount), 0);
    const approved = filteredExpenses.filter(e => e.Status === 'Approved').length;
    const pending = filteredExpenses.filter(e => e.Status === 'Pending').length;
    const rejected = filteredExpenses.filter(e => e.Status === 'Rejected').length;

    return { total, approved, pending, rejected, count: filteredExpenses.length };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ mt: 3, borderRadius: 3 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 }, 
      background: COLORS.background, 
      minHeight: '100vh',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            gap: 2,
            mb: 1
          }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" color={COLORS.primary} gutterBottom>
                Expense Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track and manage expense claims efficiently
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={exportToCsv}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                bgcolor: COLORS.secondary,
                '&:hover': { 
                  bgcolor: '#5a6fd8',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Export CSV
            </Button>
          </Box>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                icon={<AttachMoney />}
                title="Total Amount"
                value={formatCurrency(stats.total)}
                color={COLORS.secondary}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                icon={<CheckCircle />}
                title="Approved"
                value={stats.approved}
                color={COLORS.success}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                icon={<Pending />}
                title="Pending"
                value={stats.pending}
                color={COLORS.warning}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                icon={<ErrorIcon />}
                title="Rejected"
                value={stats.rejected}
                color={COLORS.error}
              />
            </Grid>
          </Grid>
        </motion.div>
      </Box>

      {/* Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card sx={{ 
          mb: 4, 
          borderRadius: 3, 
          border: 'none',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  size="medium"
                  placeholder="Search by employee name or expense type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  size="medium"
                  label="Filter by Status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                >
                  <MenuItem value="All">All Status</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={1}>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ fontWeight: 'medium' }}>
                  {filteredExpenses.length} {filteredExpenses.length === 1 ? 'item' : 'items'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Expense Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 3, 
            border: 'none',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ 
                bgcolor: 'grey.50',
                '& th': {
                  fontWeight: 'bold',
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  py: 2
                }
              }}>
                <TableCell>Employee</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Receipt</TableCell>
                <TableCell>Status</TableCell>
                {user?.role === 'HR' && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {filteredExpenses
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((expense, index) => (
                    <motion.tr
                      key={expense.detailId}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      component={TableRow}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'action.hover',
                          transform: 'scale(1)'
                        },
                        '&:last-child td': { borderBottom: 0 },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              width: 40, 
                              height: 40, 
                              bgcolor: COLORS.primary,
                              fontSize: '0.875rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {expense.employeeName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {expense.employeeName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.primary">
                          {formatDate(expense.expenseDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expense.expenseType}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            borderRadius: 1.5,
                            fontWeight: 'medium'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="bold" color={COLORS.primary}>
                          {formatCurrency(expense.expenseAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {expense.image ? (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => handleViewImage(expense.image)}
                            sx={{ 
                              borderRadius: 2,
                              textTransform: 'none'
                            }}
                          >
                            View
                          </Button>
                        ) : (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No receipt
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(expense.Status)}
                          label={expense.Status}
                          size="small"
                          sx={{
                            bgcolor: `${getStatusColor(expense.Status)}15`,
                            color: getStatusColor(expense.Status),
                            border: `1px solid ${getStatusColor(expense.Status)}30`,
                            borderRadius: 2,
                            fontWeight: 'medium'
                          }}
                        />
                      </TableCell>
                      {user?.role === 'HR' && (
                        <TableCell>
                          {expense.Status === 'Pending' ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  onClick={() => handleStatusChange(expense.detailId, 'Approved')}
                                  sx={{ 
                                    color: COLORS.success,
                                    bgcolor: `${COLORS.success}15`,
                                    '&:hover': { bgcolor: `${COLORS.success}25` }
                                  }}
                                >
                                  <Check fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  onClick={() => handleStatusChange(expense.detailId, 'Rejected')}
                                  sx={{ 
                                    color: COLORS.error,
                                    bgcolor: `${COLORS.error}15`,
                                    '&:hover': { bgcolor: `${COLORS.error}25` }
                                  }}
                                >
                                  <Cancel fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                              Completed
                            </Typography>
                          )}
                        </TableCell>
                      )}
                    </motion.tr>
                  ))}
              </AnimatePresence>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  count={filteredExpenses.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  sx={{
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      fontWeight: 'medium'
                    }
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </motion.div>

      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Receipt Image</DialogTitle>
        <DialogContent>
          {selectedImage && (
            <img
              src={selectedImage || "/placeholder.svg"}
              alt="Receipt"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: 12
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setImageDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            fontWeight: 'medium'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default EnhancedViewExpense;