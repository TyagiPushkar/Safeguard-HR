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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { GetApp, Schedule } from "@mui/icons-material";
import axios from "axios";
import { saveAs } from "file-saver";
import { useAuth } from "../auth/AuthContext";

const AttendanceReport = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  // Memoized constants
  const NORMAL_SHIFT_HOURS = useMemo(() => 9, []);
  const LATE_THRESHOLD_MINUTES = useMemo(() => 30, []);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [employeesRes, attendanceRes, leaveRes, salaryRes] =
          await Promise.allSettled([
            axios.get(
              `https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`
            ),
            axios.get(
              "https://namami-infotech.com/SAFEGUARD/src/attendance/get_attendance.php"
            ),
            axios.get(
              "https://namami-infotech.com/SAFEGUARD/src/leave/get_leave.php?role=HR"
            ),
            axios.get(
              "https://namami-infotech.com/SAFEGUARD/src/salary/get_salary.php"
            ),
          ]);

        // Process responses
        if (
          employeesRes.status === "fulfilled" &&
          employeesRes.value.data.success
        ) {
          setEmployees(employeesRes.value.data.data || []);
        }

        if (
          attendanceRes.status === "fulfilled" &&
          attendanceRes.value.data.success
        ) {
          setAttendance(attendanceRes.value.data.data || []);
        }

        if (leaveRes.status === "fulfilled" && leaveRes.value.data.success) {
          setLeaveData(leaveRes.value.data.data || []);
        }

        if (salaryRes.status === "fulfilled" && salaryRes.value.data.success) {
          setSalaryData(salaryRes.value.data.data || []);
        }

        // Check for errors
        const errors = [];
        if (employeesRes.status === "rejected") errors.push("Employees");
        if (attendanceRes.status === "rejected") errors.push("Attendance");
        if (leaveRes.status === "rejected") errors.push("Leave");
        if (salaryRes.status === "rejected") errors.push("Salary");

        if (errors.length > 0) {
          setError(
            `Failed to load: ${errors.join(", ")}. Some data may be incomplete.`
          );
        }
      } catch (error) {
        console.error("Error in fetch:", error);
        setError("Failed to initialize data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.tenent_id]);

  // Helper functions
  const getDaysInMonth = useCallback((month, year) => {
    return new Date(year, month, 0).getDate();
  }, []);

  const isSunday = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.getDay() === 0;
  }, []);

  const formatHoursToHoursMinutes = useCallback((decimalHours) => {
    if (!decimalHours || decimalHours === 0) return "0 Hr 0 Min";
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours} Hr ${minutes} Min`;
  }, []);

  const calculateOTHours = useCallback(
    (inTime, outTime) => {
      if (
        !inTime ||
        !outTime ||
        inTime === "0000-00-00 00:00:00" ||
        outTime === "0000-00-00 00:00:00"
      ) {
        return 0;
      }

      try {
        const inDate = new Date(inTime);
        const outDate = new Date(outTime);

        if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) return 0;

        const totalWorkedHours = (outDate - inDate) / (1000 * 60 * 60);
        const otHours = Math.max(0, totalWorkedHours - NORMAL_SHIFT_HOURS - 1);
        return Math.round(otHours * 100) / 100;
      } catch {
        return 0;
      }
    },
    [NORMAL_SHIFT_HOURS]
  );

  const isLatePunch = useCallback((inTime) => {
    if (!inTime || inTime === "0000-00-00 00:00:00") return false;
    try {
      const inDate = new Date(inTime);
      if (isNaN(inDate.getTime())) return false;
      const hours = inDate.getHours();
      const minutes = inDate.getMinutes();
      return hours === 9 && minutes > 0 && minutes <= 30;
    } catch {
      return false;
    }
  }, []);

  const isVeryLatePunch = useCallback((inTime) => {
    if (!inTime || inTime === "0000-00-00 00:00:00") return false;
    try {
      const inDate = new Date(inTime);
      if (isNaN(inDate.getTime())) return false;
      const hours = inDate.getHours();
      const minutes = inDate.getMinutes();
      return hours > 9 || (hours === 9 && minutes > 30);
    } catch {
      return false;
    }
  }, []);

  // Get normalized employee ID for matching
  const normalizeEmpId = useCallback((empId) => {
    if (!empId) return "";
    const strId = String(empId).trim();
    // Remove SGI prefix if present and pad to 4 digits
    const cleanId = strId.replace(/^SGI/i, "");
    return cleanId.padStart(4, "0");
  }, []);

  // Find attendance records for employee on specific date
  const getAttendanceRecords = useCallback(
    (employeeId, date) => {
      if (!employeeId || !date) return [];

      const normalizedEmpId = normalizeEmpId(employeeId);

      return attendance.filter((record) => {
        const recordEmpId = normalizeEmpId(record.EmpId || record.empId);
        const recordDate = record.InTime
          ? record.InTime.split(" ")[0]
          : record.attendance_date
          ? record.attendance_date.split(" ")[0]
          : record.Date
          ? record.Date.split(" ")[0]
          : "";

        return recordEmpId === normalizedEmpId && recordDate === date;
      });
    },
    [attendance, normalizeEmpId]
  );

  // Find leave records for employee on specific date
  const getLeaveForDate = useCallback(
    (employeeId, date) => {
      if (!employeeId || !date) return null;

      const normalizedEmpId = normalizeEmpId(employeeId);
      const targetDate = new Date(date);

      const leave = leaveData.find((record) => {
        const leaveEmpId = normalizeEmpId(record.EmpId || record.empId);
        const startDate = new Date(record.StartDate || record.startDate);
        const endDate = new Date(record.EndDate || record.endDate);

        return (
          leaveEmpId === normalizedEmpId &&
          record.Status === "Approved" &&
          targetDate >= startDate &&
          targetDate <= endDate
        );
      });

      return leave ? leave.Category || leave.category || "CL" : null;
    },
    [leaveData, normalizeEmpId]
  );

  // Get salary for employee
  const getEmployeeSalary = useCallback(
    (employeeId) => {
      if (!employeeId) return null;

      const normalizedEmpId = normalizeEmpId(employeeId);
      const salary = salaryData.find(
        (s) => normalizeEmpId(s.empId || s.EmpId) === normalizedEmpId
      );

      if (!salary) return null;

      return {
        basic: parseFloat(salary.basic_salary) || 0,
        hra: parseFloat(salary.hra) || 0,
        conveyance: parseFloat(salary.conveyance) || 0,
        specialAllowance: parseFloat(salary.special_allowance) || 0,
        epf: parseFloat(salary.epf) || 0,
        esi: parseFloat(salary.esi) || 0,
        netTakeHome: parseFloat(salary.net_take_home) || 0,
      };
    },
    [salaryData, normalizeEmpId]
  );

  // Calculate attendance status for a day
  const getDayStatus = useCallback(
    (employeeId, date) => {
      const leaveType = getLeaveForDate(employeeId, date);
      if (leaveType) return leaveType; // CL or SL

      const records = getAttendanceRecords(employeeId, date);

      // Sunday handling
      if (isSunday(date)) {
        return records.length > 0 ? "P" : "WO";
      }

      // No records = Absent
      if (records.length === 0) return "A";

      const record = records[0];
      const inTime = record.InTime || record.in_time;
      const outTime = record.OutTime || record.out_time;

      // Only In time present
      if ((!outTime || outTime === "0000-00-00 00:00:00") && inTime) {
        if (isVeryLatePunch(inTime)) return "HD";
        if (isLatePunch(inTime)) {
          // Count late days up to this date
          const currentMonth = parseInt(date.split("-")[1]);
          let lateCount = 0;
          for (let day = 1; day < parseInt(date.split("-")[2]); day++) {
            const checkDate = `${year}-${String(currentMonth).padStart(
              2,
              "0"
            )}-${String(day).padStart(2, "0")}`;
            const checkRecords = getAttendanceRecords(employeeId, checkDate);
            if (checkRecords.length > 0) {
              const checkInTime =
                checkRecords[0].InTime || checkRecords[0].in_time;
              if (checkInTime && isLatePunch(checkInTime)) lateCount++;
            }
          }
          return lateCount < 3 ? "P" : "HD";
        }
        return "P";
      }

      // Both times present
      if (
        inTime &&
        outTime &&
        inTime !== "0000-00-00 00:00:00" &&
        outTime !== "0000-00-00 00:00:00"
      ) {
        if (isVeryLatePunch(inTime)) return "HD";

        if (isLatePunch(inTime)) {
          // Similar late count logic
          const currentMonth = parseInt(date.split("-")[1]);
          let lateCount = 0;
          for (let day = 1; day < parseInt(date.split("-")[2]); day++) {
            const checkDate = `${year}-${String(currentMonth).padStart(
              2,
              "0"
            )}-${String(day).padStart(2, "0")}`;
            const checkRecords = getAttendanceRecords(employeeId, checkDate);
            if (checkRecords.length > 0) {
              const checkInTime =
                checkRecords[0].InTime || checkRecords[0].in_time;
              if (checkInTime && isLatePunch(checkInTime)) lateCount++;
            }
          }
          return lateCount < 3 ? "P" : "HD";
        }

        // Calculate work duration
        try {
          const inDate = new Date(inTime);
          const outDate = new Date(outTime);
          if (!isNaN(inDate.getTime()) && !isNaN(outDate.getTime())) {
            const workDuration = (outDate - inDate) / (1000 * 60 * 60);
            if (workDuration >= 8) return "P";
            if (workDuration >= 4) return "HD";
          }
        } catch {
          // If date parsing fails, assume present
          return "P";
        }
      }

      return "A";
    },
    [
      getLeaveForDate,
      getAttendanceRecords,
      isSunday,
      isVeryLatePunch,
      isLatePunch,
      year,
    ]
  );

  // Calculate OT for a day
  const getDayOT = useCallback(
    (employeeId, date) => {
      const records = getAttendanceRecords(employeeId, date);
      if (records.length === 0) return 0;

      const record = records[0];
      const inTime = record.InTime || record.in_time;
      const outTime = record.OutTime || record.out_time;

      if (
        !inTime ||
        !outTime ||
        inTime === "0000-00-00 00:00:00" ||
        outTime === "0000-00-00 00:00:00"
      ) {
        return 0;
      }

      return calculateOTHours(inTime, outTime);
    },
    [getAttendanceRecords, calculateOTHours]
  );

  // Calculate summary for employee
  const calculateEmployeeSummary = useCallback(
    (employeeId) => {
      const currentMonth = parseInt(month);
      const daysInMonth = getDaysInMonth(currentMonth, year);

      let presentCount = 0;
      let absentCount = 0;
      let weeklyOffCount = 0;
      let halfDayCount = 0;
      let clCount = 0;
      let slCount = 0;
      let sundayWorkingCount = 0;
      let totalOTHours = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(currentMonth).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;
        const status = getDayStatus(employeeId, date);
        const otHours = getDayOT(employeeId, date);

        totalOTHours += otHours;

        if (status === "P") {
          presentCount++;
          if (isSunday(date)) {
            sundayWorkingCount++;
            presentCount++; // Double count for Sunday working
          }
        } else if (status === "A") {
          absentCount++;
        } else if (status === "WO") {
          weeklyOffCount++;
        } else if (status === "HD") {
          halfDayCount++;
          presentCount += 0.5; // Half day counts as 0.5
        } else if (status === "CL") {
          clCount++;
        } else if (status === "SL") {
          slCount++;
        }
      }

      const effectivePresentDays = presentCount;

      return {
        presentCount,
        absentCount,
        weeklyOffCount,
        halfDayCount,
        clCount,
        slCount,
        sundayWorkingCount,
        totalOTHours,
        totalOTFormatted: formatHoursToHoursMinutes(totalOTHours),
        effectivePresentDays,
        totalDays: daysInMonth,
      };
    },
    [
      month,
      year,
      getDaysInMonth,
      getDayStatus,
      getDayOT,
      isSunday,
      formatHoursToHoursMinutes,
    ]
  );

  // Calculate salary for employee
  const calculateEmployeeSalary = useCallback(
    (employeeId, summary) => {
      const salary = getEmployeeSalary(employeeId);
      if (!salary) {
        return {
          basic: 0,
          hra: 0,
          conveyance: 0,
          specialAllowance: 0,
          netSalary: 0,
          otWages: 0,
        };
      }

      const currentMonth = parseInt(month);
      const daysInMonth = getDaysInMonth(currentMonth, year);
      const workingDays = daysInMonth - summary.weeklyOffCount;

      if (workingDays === 0) {
        return {
          basic: 0,
          hra: 0,
          conveyance: 0,
          specialAllowance: 0,
          netSalary: 0,
          otWages: 0,
        };
      }

      // Daily rates
      const dailyRateBasic = salary.basic / workingDays;
      const dailyRateHRA = salary.hra / workingDays;
      const dailyRateConveyance = salary.conveyance / workingDays;
      const dailyRateSpecialAllowance = salary.specialAllowance / workingDays;

      // Pro-rated salary
      const calculatedBasic = dailyRateBasic * summary.effectivePresentDays;
      const calculatedHRA = dailyRateHRA * summary.effectivePresentDays;
      const calculatedConveyance =
        dailyRateConveyance * summary.effectivePresentDays;
      const calculatedSpecialAllowance =
        dailyRateSpecialAllowance * summary.effectivePresentDays;

      // OT calculation
      const totalMonthlySalary =
        salary.basic + salary.hra + salary.conveyance + salary.specialAllowance;
      const otRatePerHour = totalMonthlySalary / (workingDays * 8);
      const otWages =
        summary.totalOTHours > 0
          ? summary.totalOTHours * otRatePerHour * 1.25
          : 0;

      // Total salary
      const totalGross =
        calculatedBasic +
        calculatedHRA +
        calculatedConveyance +
        calculatedSpecialAllowance +
        otWages;
      const deductions = salary.epf + salary.esi;
      const netSalary = totalGross - deductions;

      return {
        basic: Math.round(calculatedBasic),
        hra: Math.round(calculatedHRA),
        conveyance: Math.round(calculatedConveyance),
        specialAllowance: Math.round(calculatedSpecialAllowance),
        netSalary: Math.max(0, Math.round(netSalary)),
        otWages: Math.round(otWages),
      };
    },
    [month, year, getDaysInMonth, getEmployeeSalary]
  );

  // Export to CSV
  const exportToCSV = async () => {
    if (!month) {
      alert("Please select a month");
      return;
    }

    setExporting(true);
    setError("");

    try {
      const currentMonth = parseInt(month);
      const daysInMonth = getDaysInMonth(currentMonth, year);
      const monthName = monthNames[currentMonth - 1];

      // Create header
      const header = [
        "S.R NO.",
        "UAN",
        "ESI",
        "Emp. Code",
        "Name of Emp.",
        "Father Name",
        "Designation",
        "CADRE",
        "DOJ",
        "",
      ];

      // Add date columns
      for (let day = 1; day <= daysInMonth; day++) {
        header.push(
          `${year}-${String(currentMonth).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")} 00:00:00`,
          "",
          "INCE."
        );
      }

      // Add summary columns
      const summaryColumns = [
        "P",
        "NT",
        "CL",
        "SL",
        "LWP",
        "GH",
        "PWO",
        "WO",
        "C-OFF",
        "ABSENT",
        "WI",
        "TOTAL DAYS",
        "SUN WORKING (DOUBLE)",
        "WORKING DAY OT (EXTRA HOURS WORKING@1.25)",
        "WORKING DAY OT (EXTRA HOURS WORKING@1.25)",
        "(Inc1DM+Inc2 DN)@1.25",
        "TOTAL DAYS FOR EMP",
        "OT WAGES",
        "BASIC SALARY",
        "HRA",
        "CONVEYANCE",
        "SPECIAL ALLOWANCE",
        "NET SALARY",
      ];

      header.push(...summaryColumns);

      const csvRows = [header];

      // Process employees in batches to avoid freezing
      const batchSize = 10;

      for (let i = 0; i < employees.length; i += batchSize) {
        const batch = employees.slice(i, i + batchSize);

        for (let j = 0; j < batch.length; j++) {
          const employee = batch[j];
          const summary = calculateEmployeeSummary(employee.EmpId);
          const salary = calculateEmployeeSalary(employee.EmpId, summary);

          // Start row
          const row = [
            (i + j + 1).toString(), // S.R NO.
            employee.UAN || "", // UAN
            employee.ESI || "", // ESI
            employee.EmpId, // Emp. Code
            employee.Name || "", // Name of Emp.
            employee.FatherName || "", // Father Name
            employee.Designation || "", // Designation
            employee.Grade || "", // CADRE
            employee.JoinDate
              ? `${employee.JoinDate.split("T")[0]} 00:00:00`
              : "", // DOJ
            "Status", // Status column
          ];

          // Add daily status
          for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(currentMonth).padStart(
              2,
              "0"
            )}-${String(day).padStart(2, "0")}`;
            const status = getDayStatus(employee.EmpId, date);
            const otHours = getDayOT(employee.EmpId, date);

            row.push(status, status); // Two status columns
            row.push(otHours > 0 ? formatHoursToHoursMinutes(otHours) : ""); // INCE.
          }

          // Add summary
          row.push(
            summary.presentCount.toString(), // P
            "0", // NT
            summary.clCount.toString(), // CL
            summary.slCount.toString(), // SL
            "0", // LWP
            "0", // GH
            "0", // PWO
            summary.weeklyOffCount.toString(), // WO
            "0", // C-OFF
            summary.absentCount.toString(), // ABSENT
            "0", // WI
            summary.totalDays.toString(), // TOTAL DAYS
            summary.sundayWorkingCount.toString(), // SUN WORKING (DOUBLE)
            summary.totalOTFormatted, // WORKING DAY OT
            summary.totalOTFormatted, // WORKING DAY OT (duplicate)
            formatHoursToHoursMinutes(summary.totalOTHours * 1.25), // (Inc1DM+Inc2 DN)@1.25
            summary.effectivePresentDays.toString(), // TOTAL DAYS FOR EMP
            salary.otWages.toString(), // OT WAGES
            salary.basic.toString(), // BASIC SALARY
            salary.hra.toString(), // HRA
            salary.conveyance.toString(), // CONVEYANCE
            salary.specialAllowance.toString(), // SPECIAL ALLOWANCE
            salary.netSalary.toString() // NET SALARY
          );

          csvRows.push(row);
        }

        // Yield to browser to prevent freezing
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      // Create CSV content
      const csvContent = csvRows
        .map((row) => row.map((field) => `"${field || ""}"`).join(","))
        .join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `ATTENDANCE_${monthName}_${year}.csv`);
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to generate report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Data statistics
  const stats = useMemo(
    () => ({
      totalEmployees: employees.length,
      attendanceRecords: attendance.length,
      leaveRecords: leaveData.length,
      salaryRecords: salaryData.length,
      monthName: month ? monthNames[parseInt(month) - 1] : "",
      year,
    }),
    [employees, attendance, leaveData, salaryData, month, year, monthNames]
  );

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent>
        <Typography
          variant="h5"
          component="h2"
          sx={{ mb: 3, color: "primary.main", fontWeight: 600 }}
        >
          <Schedule sx={{ mr: 1, verticalAlign: "middle" }} />
          Monthly Attendance Report
        </Typography>

        {/* Controls */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Month</InputLabel>
              <Select
                value={month}
                label="Month"
                onChange={(e) => setMonth(e.target.value)}
              >
                {monthNames.map((name, index) => (
                  <MenuItem key={index} value={(index + 1).toString()}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Year"
              type="number"
              variant="outlined"
              size="small"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={2}
              justifyContent="flex-end"
            >
              <Button
                variant="contained"
                onClick={exportToCSV}
                disabled={!month || loading || exporting}
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

        {/* Stats Card */}
        {month && (
          <Card
            sx={{
              mb: 3,
              bgcolor: "grey.50",
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <CardContent>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                {stats.monthName} {stats.year} - Data Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Employees
                  </Typography>
                  <Typography variant="h6">{stats.totalEmployees}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Attendance Records
                  </Typography>
                  <Typography variant="h6">
                    {stats.attendanceRecords}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Leave Records
                  </Typography>
                  <Typography variant="h6">{stats.leaveRecords}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Salary Records
                  </Typography>
                  <Typography variant="h6">{stats.salaryRecords}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
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
              Loading data...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Information */}
        {month && !loading && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Sunday working is counted as double present
              days. OT is calculated at 1.25x rate. Salary is pro-rated based on
              actual attendance.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceReport;
