"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Chip,
} from "@mui/material";
import { GetApp, AccessTime } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";
import { saveAs } from "file-saver";
import { useAuth } from "../auth/AuthContext";

const MonthlyInOutReport = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const monthNames = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];

  const filterActiveEmployees = useCallback((emps) => {
    return emps.filter((emp) => {
      const isActive = emp.IsActive || emp.isActive;
      return isActive === 1 || isActive === "1";
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [empRes, attRes] = await Promise.allSettled([
          axios.get(
            `https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`
          ),
          axios.get(
            "https://namami-infotech.com/SAFEGUARD/src/attendance/get_attendance.php"
          ),
        ]);

        if (empRes.status === "fulfilled" && empRes.value.data.success) {
          setEmployees(filterActiveEmployees(empRes.value.data.data || []));
        }
        if (attRes.status === "fulfilled" && attRes.value.data.success) {
          setAttendance(attRes.value.data.data || []);
        }

        const errors = [];
        if (empRes.status === "rejected") errors.push("Employees");
        if (attRes.status === "rejected") errors.push("Attendance");
        if (errors.length > 0) {
          setError(`Failed to load: ${errors.join(", ")}. Some data may be incomplete.`);
        }
      } catch (err) {
        setError("Failed to initialize data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.tenent_id, filterActiveEmployees]);

  const normalizeEmpId = useCallback((empId) => {
    if (!empId) return "";
    const strId = String(empId).trim();
    const cleanId = strId.replace(/^SGI/i, "");
    return cleanId.padStart(4, "0");
  }, []);

  const getDaysInMonth = useCallback((m, y) => new Date(y, m, 0).getDate(), []);

  const getAttendanceForDay = useCallback(
    (employeeId, date) => {
      if (!employeeId || !date) return null;
      const normalizedId = normalizeEmpId(employeeId);
      const record = attendance.find((r) => {
        const recId = normalizeEmpId(r.EmpId || r.empId);
        const recDate = r.InTime
          ? r.InTime.split(" ")[0]
          : r.attendance_date
          ? r.attendance_date.split(" ")[0]
          : r.Date
          ? r.Date.split(" ")[0]
          : "";
        return recId === normalizedId && recDate === date;
      });
      return record || null;
    },
    [attendance, normalizeEmpId]
  );

  const formatTime = useCallback((timeStr) => {
    if (!timeStr || timeStr === "0000-00-00 00:00:00") return "-";
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return "-";
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
    } catch {
      return "-";
    }
  }, []);

  const calculateWorkingHours = useCallback((inTime, outTime) => {
    if (
      !inTime ||
      !outTime ||
      inTime === "0000-00-00 00:00:00" ||
      outTime === "0000-00-00 00:00:00"
    )
      return null;
    try {
      const diff = (new Date(outTime) - new Date(inTime)) / (1000 * 60 * 60);
      if (diff <= 0) return null;
      return diff;
    } catch {
      return null;
    }
  }, []);

  const formatHours = useCallback((decimalHours) => {
    if (!decimalHours || decimalHours <= 0) return "0h 0m";
    const h = Math.floor(decimalHours);
    const m = Math.round((decimalHours - h) * 60);
    return `${h}h ${m}m`;
  }, []);

  const daysInMonth = useMemo(
    () => getDaysInMonth(month, year),
    [month, year, getDaysInMonth]
  );

  const days = useMemo(() => {
    const arr = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
      arr.push({ day: d, dateStr, dayOfWeek });
    }
    return arr;
  }, [daysInMonth, month, year]);

  const displayedEmployees = useMemo(() => {
    if (selectedEmployee) {
      return employees.filter(
        (e) => normalizeEmpId(e.EmpId) === normalizeEmpId(selectedEmployee.EmpId)
      );
    }
    return employees;
  }, [employees, selectedEmployee, normalizeEmpId]);

  // Pre-compute row data to avoid repeated computation in render
  const rowData = useMemo(() => {
    return displayedEmployees.map((emp) => {
      let presentCount = 0;
      let totalHoursDecimal = 0;

      const dayCells = days.map(({ dateStr }) => {
        const rec = getAttendanceForDay(emp.EmpId, dateStr);
        if (rec) {
          const inTime = rec.InTime || rec.in_time || "";
          const outTime = rec.OutTime || rec.out_time || "";
          const formattedIn = formatTime(inTime);
          const formattedOut = formatTime(outTime);
          if (inTime && inTime !== "0000-00-00 00:00:00") {
            presentCount++;
            const hrs = calculateWorkingHours(inTime, outTime);
            if (hrs) totalHoursDecimal += hrs;
          }
          return { in: formattedIn, out: formattedOut, hasRecord: true };
        }
        return { in: "-", out: "-", hasRecord: false };
      });

      return { emp, dayCells, presentCount, totalHoursDecimal };
    });
  }, [displayedEmployees, days, getAttendanceForDay, formatTime, calculateWorkingHours]);

  const exportToCSV = async () => {
    setExporting(true);
    setError("");
    try {
      const monthName = monthNames[month - 1];
      const header = ["S.R NO.", "Emp. Code", "Name", "Designation", "Grade", "Office"];

      for (const { dateStr, dayOfWeek } of days) {
        header.push(`${dateStr} (${dayOfWeek}) In`);
        header.push(`${dateStr} (${dayOfWeek}) Out`);
        header.push(`${dateStr} (${dayOfWeek}) Hrs`);
      }
      header.push("Total Present Days", "Total Working Hours");

      const csvRows = [header];
      const targetEmployees = displayedEmployees;

      for (let i = 0; i < targetEmployees.length; i += 10) {
        const batch = targetEmployees.slice(i, i + 10);
        for (let j = 0; j < batch.length; j++) {
          const emp = batch[j];
          const row = [
            (i + j + 1).toString(),
            emp.EmpId || "",
            emp.Name || "",
            emp.Designation || "",
            emp.Grade || "",
            emp.OfficeName || emp.office_name || "",
          ];

          let presentCount = 0;
          let totalHoursDecimal = 0;

          for (const { dateStr } of days) {
            const rec = getAttendanceForDay(emp.EmpId, dateStr);
            if (rec) {
              const inTime = rec.InTime || rec.in_time || "";
              const outTime = rec.OutTime || rec.out_time || "";
              row.push(formatTime(inTime));
              row.push(formatTime(outTime));
              const hrs = calculateWorkingHours(inTime, outTime);
              row.push(hrs ? formatHours(hrs) : "-");
              if (inTime && inTime !== "0000-00-00 00:00:00") {
                presentCount++;
                if (hrs) totalHoursDecimal += hrs;
              }
            } else {
              row.push("-", "-", "-");
            }
          }

          row.push(presentCount.toString());
          row.push(formatHours(totalHoursDecimal));
          csvRows.push(row);
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      const csvContent = csvRows
        .map((row) => row.map((f) => `"${String(f || "").replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `IN_OUT_REPORT_${monthName}_${year}.csv`);
    } catch (err) {
      console.error("Export error:", err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const headerCellSx = {
    fontWeight: 700,
    bgcolor: "#8d0638",
    color: "white",
    whiteSpace: "nowrap",
    borderRight: "1px solid rgba(255,255,255,0.2)",
  };

  const subHeaderCellSx = {
    fontWeight: 600,
    fontSize: "0.72rem",
    bgcolor: "#b00548",
    color: "white",
    whiteSpace: "nowrap",
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <Typography
            variant="h5"
            component="h2"
            sx={{ mb: 3, color: "primary.main", fontWeight: 600 }}
          >
            <AccessTime sx={{ mr: 1, verticalAlign: "middle" }} />
            Monthly In/Out Time Report
          </Typography>

          {/* Controls */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <DatePicker
                views={["year", "month"]}
                label="Select Month & Year"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                renderInput={(params) => (
                  <TextField {...params} size="small" fullWidth />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Autocomplete
                options={employees}
                getOptionLabel={(emp) => `${emp.EmpId} - ${emp.Name}`}
                value={selectedEmployee}
                onChange={(_, newVal) => setSelectedEmployee(newVal)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Filter by Employee (optional)"
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack
                direction="row"
                spacing={2}
                justifyContent={isMobile ? "flex-start" : "flex-end"}
              >
                <Button
                  variant="contained"
                  onClick={exportToCSV}
                  disabled={loading || exporting || employees.length === 0}
                  sx={{
                    bgcolor: "primary.main",
                    "&:hover": { bgcolor: "primary.dark" },
                    minWidth: 150,
                  }}
                >
                  {exporting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <>
                      <GetApp sx={{ mr: 1 }} />
                      Export CSV
                    </>
                  )}
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {/* Summary chips */}
          {!loading && employees.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
              <Chip
                label={`${employees.length} Active Employees`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`${monthNames[month - 1]} ${year}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
              <Chip
                label={`${daysInMonth} Days`}
                size="small"
                variant="outlined"
              />
              {selectedEmployee && (
                <Chip
                  label={`Filtered: ${selectedEmployee.Name}`}
                  size="small"
                  color="warning"
                  onDelete={() => setSelectedEmployee(null)}
                />
              )}
            </Stack>
          )}

          {/* Loading State */}
          {loading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 4,
              }}
            >
              <CircularProgress size={40} sx={{ mr: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Loading employee data...
              </Typography>
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Report Table */}
          {!loading && rowData.length > 0 && (
            <TableContainer
              component={Paper}
              sx={{ mt: 2, maxHeight: 520, overflow: "auto", border: "1px solid", borderColor: "divider" }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  {/* Row 1: main headers */}
                  <TableRow>
                    <TableCell sx={{ ...headerCellSx, minWidth: 45 }}>S.R</TableCell>
                    <TableCell sx={{ ...headerCellSx, minWidth: 100 }}>Emp. Code</TableCell>
                    <TableCell sx={{ ...headerCellSx, minWidth: 150 }}>Name</TableCell>
                    {days.map(({ day, dateStr, dayOfWeek }) => (
                      <TableCell
                        key={dateStr}
                        align="center"
                        colSpan={2}
                        sx={{
                          ...headerCellSx,
                          minWidth: 160,
                          bgcolor:
                            dayOfWeek === "Sun"
                              ? "#5c0425"
                              : dayOfWeek === "Sat"
                              ? "#6e0530"
                              : "#8d0638",
                        }}
                      >
                        {day} {dayOfWeek}
                      </TableCell>
                    ))}
                    <TableCell sx={{ ...headerCellSx, minWidth: 80 }}>Present</TableCell>
                    <TableCell sx={{ ...headerCellSx, minWidth: 110 }}>Total Hrs</TableCell>
                  </TableRow>

                  {/* Row 2: In/Out sub-headers */}
                  <TableRow>
                    <TableCell sx={subHeaderCellSx} colSpan={3} />
                    {days.map(({ dateStr }) => (
                      <>
                        <TableCell
                          key={`${dateStr}-in`}
                          sx={{ ...subHeaderCellSx, minWidth: 80 }}
                        >
                          In
                        </TableCell>
                        <TableCell
                          key={`${dateStr}-out`}
                          sx={{ ...subHeaderCellSx, minWidth: 80 }}
                        >
                          Out
                        </TableCell>
                      </>
                    ))}
                    <TableCell sx={subHeaderCellSx} colSpan={2} />
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rowData.map(({ emp, dayCells, presentCount, totalHoursDecimal }, idx) => (
                    <TableRow
                      key={emp.EmpId}
                      hover
                      sx={{ "&:nth-of-type(odd)": { bgcolor: "grey.50" } }}
                    >
                      <TableCell sx={{ fontSize: "0.8rem" }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                        {emp.EmpId}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                        {emp.Name}
                      </TableCell>

                      {dayCells.map((cell, di) => (
                        <>
                          <TableCell
                            key={`${emp.EmpId}-${di}-in`}
                            sx={{
                              fontSize: "0.72rem",
                              color: cell.hasRecord ? "success.dark" : "text.disabled",
                              borderLeft: "1px solid",
                              borderColor: "divider",
                              px: 0.5,
                            }}
                          >
                            {cell.in}
                          </TableCell>
                          <TableCell
                            key={`${emp.EmpId}-${di}-out`}
                            sx={{
                              fontSize: "0.72rem",
                              color: cell.hasRecord && cell.out !== "-" ? "error.dark" : "text.disabled",
                              px: 0.5,
                            }}
                          >
                            {cell.out}
                          </TableCell>
                        </>
                      ))}

                      <TableCell>
                        <Chip
                          label={presentCount}
                          size="small"
                          color={
                            presentCount >= 20
                              ? "success"
                              : presentCount >= 10
                              ? "warning"
                              : "error"
                          }
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                        {formatHours(totalHoursDecimal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!loading && employees.length > 0 && rowData.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No employees found for the selected filter.
            </Alert>
          )}
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default MonthlyInOutReport;
