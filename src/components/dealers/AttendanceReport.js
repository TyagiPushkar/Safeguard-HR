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
} from "@mui/material";
import { GetApp, Schedule } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";
import { saveAs } from "file-saver";
import { useAuth } from "../auth/AuthContext";

const AttendanceReport = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Extract month and year from selectedDate
  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

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

  // Filter active employees - only where IsActive === 1
  const filterActiveEmployees = useCallback((employees) => {
    return employees.filter((employee) => {
      const isActive = employee.IsActive || employee.isActive;
      return isActive === 1 || isActive === "1";
    });
  }, []);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [employeesRes, attendanceRes, leaveRes, salaryRes] =
          await Promise.allSettled([
            axios.get(
              `https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`,
            ),
            axios.get(
              "https://namami-infotech.com/SAFEGUARD/src/attendance/get_attendance.php",
            ),
            axios.get(
              "https://namami-infotech.com/SAFEGUARD/src/leave/get_leave.php?role=HR",
            ),
            axios.get(
              "https://namami-infotech.com/SAFEGUARD/src/salary/get_salary.php",
            ),
          ]);

        if (
          employeesRes.status === "fulfilled" &&
          employeesRes.value.data.success
        ) {
          const allEmployees = employeesRes.value.data.data || [];
          const activeEmployees = filterActiveEmployees(allEmployees);
          setEmployees(activeEmployees);
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

        const errors = [];
        if (employeesRes.status === "rejected") errors.push("Employees");
        if (attendanceRes.status === "rejected") errors.push("Attendance");
        if (leaveRes.status === "rejected") errors.push("Leave");
        if (salaryRes.status === "rejected") errors.push("Salary");

        if (errors.length > 0) {
          setError(
            `Failed to load: ${errors.join(", ")}. Some data may be incomplete.`,
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
  }, [user.tenent_id, filterActiveEmployees]);

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
    [NORMAL_SHIFT_HOURS],
  );

  // Get normalized employee ID for matching
  const normalizeEmpId = useCallback((empId) => {
    if (!empId) return "";
    const strId = String(empId).trim();
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
    [attendance, normalizeEmpId],
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
    [leaveData, normalizeEmpId],
  );

  // Get salary for employee
  const getEmployeeSalary = useCallback(
    (employeeId) => {
      if (!employeeId) return null;

      const normalizedEmpId = normalizeEmpId(employeeId);
      const salary = salaryData.find(
        (s) => normalizeEmpId(s.empId || s.EmpId) === normalizedEmpId,
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
    [salaryData, normalizeEmpId],
  );

  // Calculate attendance status for a day (LATE COMING LOGIC REMOVED)
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
        return "P"; // Always present if they punched in (late logic removed)
      }

      // Both times present
      if (
        inTime &&
        outTime &&
        inTime !== "0000-00-00 00:00:00" &&
        outTime !== "0000-00-00 00:00:00"
      ) {
        // Calculate work duration to determine if it's a half day
        try {
          const inDate = new Date(inTime);
          const outDate = new Date(outTime);
          if (!isNaN(inDate.getTime()) && !isNaN(outDate.getTime())) {
            const workDuration = (outDate - inDate) / (1000 * 60 * 60);
            if (workDuration >= 8) return "P";
            if (workDuration >= 4) return "P";
          }
        } catch {
          return "P";
        }
      }

      return "A";
    },
    [getLeaveForDate, getAttendanceRecords, isSunday],
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
    [getAttendanceRecords, calculateOTHours],
  );

  // Calculate summary for employee
  const calculateEmployeeSummary = useCallback(
    (employeeId) => {
      const currentMonth = month;
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
          day,
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
    ],
  );

  // Calculate salary for employee (NEW FORMULA: salary/days in month * total working days)
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

      const currentMonth = month;
      const daysInMonth = getDaysInMonth(currentMonth, year);

      // NEW FORMULA: salary/days in month * total working days (effectivePresentDays)
      // effectivePresentDays already accounts for half days (0.5) and double Sundays
      const workingDaysRatio = summary.effectivePresentDays / daysInMonth;

      // Calculate pro-rated salary based on days in month ratio
      const calculatedBasic = Math.round(salary.basic * workingDaysRatio);
      const calculatedHRA = Math.round(salary.hra * workingDaysRatio);
      const calculatedConveyance = Math.round(
        salary.conveyance * workingDaysRatio,
      );
      const calculatedSpecialAllowance = Math.round(
        salary.specialAllowance * workingDaysRatio,
      );

      // OT calculation (keep OT separate)
      const workingDays = daysInMonth - summary.weeklyOffCount;
      const totalMonthlySalary =
        salary.basic + salary.hra + salary.conveyance + salary.specialAllowance;
      const otRatePerHour =
        workingDays > 0 ? totalMonthlySalary / (workingDays * 8) : 0;
      const otWages =
        summary.totalOTHours > 0
          ? Math.round(summary.totalOTHours * otRatePerHour * 1.25)
          : 0;

      // Total salary with OT
      const totalGross =
        calculatedBasic +
        calculatedHRA +
        calculatedConveyance +
        calculatedSpecialAllowance +
        otWages;
      const deductions = salary.epf + salary.esi;
      const netSalary = Math.max(0, Math.round(totalGross - deductions));

      return {
        basic: calculatedBasic,
        hra: calculatedHRA,
        conveyance: calculatedConveyance,
        specialAllowance: calculatedSpecialAllowance,
        netSalary,
        otWages,
      };
    },
    [month, year, getDaysInMonth, getEmployeeSalary],
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
      const currentMonth = month;
      const daysInMonth = getDaysInMonth(currentMonth, year);
      const monthName = monthNames[currentMonth - 1];

      // Create header - ONE column per date with simple date format
      const header = [
        "S.R NO.",
        "UAN",
        "ESI",
        "Emp. Code",
        "Name of Emp.",
        "Father Name",
        "Designation",
        "CADRE",
        "OfficeName",
        "DOJ",
      ];

      // Add ONE date column per day with simple date format (YYYY-MM-DD)
      for (let day = 1; day <= daysInMonth; day++) {
        header.push(
          `${year}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        );
      }

      // Add summary columns (INCLUDING HALF DAYS TOTAL)
      const summaryColumns = [
        "P",
        "HD", // NEW COLUMN: Half Days Total
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

      // Process employees in batches
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
            employee.OfficeName || employee.office_name || "", // OfficeName
            employee.JoinDate ? employee.JoinDate.split("T")[0] : "", // DOJ (date only, no time)
          ];

          // Add ONE daily status per date
          for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(currentMonth).padStart(
              2,
              "0",
            )}-${String(day).padStart(2, "0")}`;
            const status = getDayStatus(employee.EmpId, date);
            row.push(status);
          }

          // Add summary (INCLUDING HALF DAYS TOTAL)
          row.push(
            summary.presentCount.toString(), // P
            summary.halfDayCount.toString(), // HD (NEW)
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
            salary.netSalary.toString(), // NET SALARY
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
      monthName: month ? monthNames[month - 1] : "",
      year,
    }),
    [employees, attendance, leaveData, salaryData, month, year, monthNames],
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
            <Grid item xs={12} md={6}>
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

            <Grid item xs={12} md={6}>
              <Stack
                direction={isMobile ? "column" : "row"}
                spacing={2}
                justifyContent="flex-end"
              >
                <Button
                  variant="contained"
                  onClick={exportToCSV}
                  disabled={loading || exporting}
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
                  {stats.monthName} {stats.year} - Active Employees
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Active Employees
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
                Loading active employee data...
              </Typography>
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default AttendanceReport;
