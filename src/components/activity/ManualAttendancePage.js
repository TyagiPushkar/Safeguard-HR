"use client";

import React from "react";
import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  useTheme,
  Stack,
  IconButton,
  TablePagination,
} from "@mui/material";
import {
  Search,
  Refresh,
  Person,
  CheckCircle,
  Cancel,
  Schedule,
  HowToReg,
  DateRange,
  Clear,
  AccessTime,
} from "@mui/icons-material";
import { format, parseISO, subDays, isAfter, isBefore } from "date-fns";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";

const StatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "Present":
        return {
          color: "success",
          label: "Present",
          icon: <CheckCircle fontSize="small" />,
        };
      case "Absent":
        return {
          color: "error",
          label: "Absent",
          icon: <Cancel fontSize="small" />,
        };
      case "On Leave":
        return {
          color: "warning",
          label: "On Leave",
          icon: <Schedule fontSize="small" />,
        };
      default:
        return {
          color: "default",
          label: "Not Marked",
          icon: <Person fontSize="small" />,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      size="small"
      icon={config.icon}
      label={config.label}
      color={config.color}
      variant="outlined"
    />
  );
};

const ManualAttendancePage = () => {
  const { user } = useAuth();
  const theme = useTheme();

  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [markAttendanceDialog, setMarkAttendanceDialog] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(subDays(new Date(), 1));
  const [inTime, setInTime] = useState("09:00");
  const [outTime, setOutTime] = useState("18:00");
  const [submitting, setSubmitting] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Calculate min and max dates for the date picker
  const getMinDate = () => {
    return format(subDays(new Date(), 30), "yyyy-MM-dd");
  };

  const getMaxDate = () => {
    return format(subDays(new Date(), 1), "yyyy-MM-dd");
  };

  // Check if date is valid for selection
  const isDateValid = (date) => {
    const selectedDate = parseISO(date);
    const minDate = subDays(new Date(), 30);
    const maxDate = new Date();

    return !isBefore(selectedDate, minDate) && !isAfter(selectedDate, maxDate);
  };

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`,
          { timeout: 10000 },
        );

        if (response.data.success && response.data.data) {
          // Filter only active employees (IsActive = 1)
          const activeEmployees = response.data.data.filter(
            (emp) => emp.IsActive === 1,
          );

          const employeesData = activeEmployees.map((emp) => ({
            ...emp,
            Name: emp.Name || emp.EmpName || "Unknown",
            EmpId: emp.EmpId,
            Department: emp.Department || emp.Dept || emp.OfficeName || "N/A",
            Designation: emp.Designation || emp.Role || "N/A",
            TodayStatus: "Not Marked",
            IsActive: emp.IsActive || 0,
          }));

          setEmployees(employeesData);
          setFilteredEmployees(employeesData);
        } else {
          setError("No employee data found");
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setError("Failed to load employee data");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [user.tenent_id]);

  // Filter employees
  useEffect(() => {
    let result = [...employees];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (emp) =>
          (emp.Name && emp.Name.toLowerCase().includes(term)) ||
          (emp.EmpId && emp.EmpId.toLowerCase().includes(term)) ||
          (emp.Department && emp.Department.toLowerCase().includes(term)),
      );
    }

    setFilteredEmployees(result);
    setPage(0); // Reset to first page when filters change
  }, [employees, searchTerm]);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
  };

  const handleMarkAttendance = (employee) => {
    setSelectedEmployee(employee);
    setAttendanceDate(subDays(new Date(), 1));
    setInTime("09:00");
    setOutTime("18:00");
    setMarkAttendanceDialog(true);
  };

  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Check if selected date is valid
      // if (!isDateValid(format(attendanceDate, "yyyy-MM-dd"))) {
      //   setError("You can only mark attendance for the last 3 days and today.");
      //   setSubmitting(false);
      //   return;
      // }

      // Prepare in-time record
      const inTimeRecord = {
        EmpId: selectedEmployee.EmpId,
        LocationId: user.location_id || "3",
        Event: "In",
        GeoLocation: "0.00000, 0.00000",
        MobileDateTime: `${format(attendanceDate, "yyyy-MM-dd")} ${inTime}:00`,
        app_ver: "Manual",
      };

      // Prepare out-time record
      const outTimeRecord = {
        EmpId: selectedEmployee.EmpId,
        LocationId: user.location_id || "3",
        Event: "Out",
        GeoLocation: "0.00000, 0.00000",
        MobileDateTime: `${format(attendanceDate, "yyyy-MM-dd")} ${outTime}:00`,
        app_ver: "Manual",
      };

      console.log("Submitting IN attendance:", inTimeRecord);
      console.log("Submitting OUT attendance:", outTimeRecord);

      // Submit IN time
      const inResponse = await axios.post(
        "https://namami-infotech.com/SAFEGUARD/src/attendance/mark_manual_attendance.php",
        inTimeRecord,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!inResponse.data?.success) {
        throw new Error(inResponse.data?.message || "IN attendance failed");
      }

      // Submit OUT time
      const outResponse = await axios.post(
        "https://namami-infotech.com/SAFEGUARD/src/attendance/mark_manual_attendance.php",
        outTimeRecord,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!outResponse.data?.success) {
        throw new Error(outResponse.data?.message || "OUT attendance failed");
      }

      // Update UI - mark as present
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.EmpId === selectedEmployee.EmpId
            ? { ...emp, TodayStatus: "Present" }
            : emp,
        ),
      );

      setSuccess(
        `Attendance marked for ${selectedEmployee.Name} (IN: ${inTime}, OUT: ${outTime})`,
      );
      setMarkAttendanceDialog(false);
      setSelectedEmployee(null);
    } catch (err) {
      console.error("Attendance submission error:", err);
      setError(err.message || "Failed to mark attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const refreshData = () => {
    window.location.reload();
  };

  const clearFilters = () => {
    setSearchTerm("");
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          bgcolor: "#8d0638ff",
          color: "white",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Manual Attendance
            </Typography>
            <Typography variant="body1">
              Mark attendance for employees manually (Last 3 days only)
            </Typography>
          </Box>
          <IconButton onClick={refreshData} sx={{ color: "white" }}>
            <Refresh />
          </IconButton>
        </Box>
      </Paper>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {searchTerm && (
            <Button size="small" onClick={clearFilters} startIcon={<Clear />}>
              Clear Filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <LinearProgress sx={{ mb: 2, maxWidth: 400, mx: "auto" }} />
          <Typography>Loading employees...</Typography>
        </Box>
      ) : (
        <>
          {/* Results Count */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: "#f0f0f0" }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body1" fontWeight={600}>
                Showing {filteredEmployees.length} active employees
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Page {page + 1} of{" "}
                {Math.ceil(filteredEmployees.length / rowsPerPage)}
              </Typography>
            </Box>
          </Paper>

          {/* Employee Table */}
          <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Employee ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getCurrentPageData().map((employee) => (
                    <TableRow key={employee.EmpId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {employee.EmpId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: "#8d0638ff" }}>
                            {employee.Name?.charAt(0) ||
                              employee.EmpId.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>
                              {employee.Name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {employee.EmailId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {employee.Designation || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {employee.Department}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleMarkAttendance(employee)}
                          startIcon={<HowToReg />}
                          sx={{
                            bgcolor: "#8d0638ff",
                            "&:hover": { bgcolor: "#6d042aff" },
                          }}
                        >
                          Mark
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={filteredEmployees.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: "1px solid rgba(224, 224, 224, 1)" }}
            />
          </Paper>

          {/* No Results */}
          {filteredEmployees.length === 0 && !loading && (
            <Paper sx={{ p: 8, textAlign: "center", borderRadius: 2, mt: 3 }}>
              <Person sx={{ fontSize: 60, color: "grey.400", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No active employees found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "No active employees in the system"}
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* Mark Attendance Dialog */}
      <Dialog
        open={markAttendanceDialog}
        onClose={() => !submitting && setMarkAttendanceDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <HowToReg sx={{ color: "#8d0638ff" }} />
            <Typography variant="h6" fontWeight={600}>
              Mark Attendance (IN/OUT)
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Stack spacing={3} mt={1}>
              {/* Employee Info */}
              <Box p={2} sx={{ bgcolor: "grey.50", borderRadius: 1 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: "#8d0638ff", width: 60, height: 60 }}>
                    {selectedEmployee.Name?.charAt(0) ||
                      selectedEmployee.EmpId.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedEmployee.Name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedEmployee.EmpId} • {selectedEmployee.Department}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedEmployee.Designation}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Current Status */}

              {/* Attendance Date */}
              <TextField
                label="Attendance Date"
                type="date"
                value={format(attendanceDate, "yyyy-MM-dd")}
                onChange={(e) => setAttendanceDate(parseISO(e.target.value))}
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DateRange />
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  min: getMinDate(),
                  max: getMaxDate(),
                }}
                helperText="You can mark attendance for the last 30 days only"
              />
              <Box display="flex" gap={2}>
                <TextField
                  label="IN Time"
                  type="time"
                  value={inTime}
                  onChange={(e) => setInTime(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTime />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Time format: HH:MM (12-hour)"
                />

                {/* Out Time */}
                <TextField
                  label="OUT Time"
                  type="time"
                  value={outTime}
                  onChange={(e) => setOutTime(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTime />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Time format: HH:MM (12-hour)"
                />
              </Box>
              {/* In Time */}

              {/* Summary */}
              <Box
                p={2}
                sx={{
                  bgcolor: "#f5f5f5",
                  borderRadius: 1,
                  border: "1px solid #e0e0e0",
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.primary"
                  gutterBottom
                >
                  Summary:
                </Typography>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Date: {format(attendanceDate, "dd/MM/yyyy")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    IN: {inTime}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    OUT: {outTime}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setMarkAttendanceDialog(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitAttendance}
            disabled={submitting}
            startIcon={<HowToReg />}
            sx={{
              bgcolor: "#8d0638ff",
              "&:hover": { bgcolor: "#6d042aff" },
            }}
          >
            {submitting ? "Saving..." : "Mark Attendance"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManualAttendancePage;
