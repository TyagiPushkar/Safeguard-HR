"use client"

import { useState, useEffect } from "react"
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Grid,
  IconButton,
  useMediaQuery,
  useTheme,
  Paper,
  InputAdornment,
  CircularProgress,
  Slide,
  Grow,
  Alert,
  Snackbar,
  Tooltip,
  Zoom,
} from "@mui/material"
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Email,
  ArrowForward,
  LockReset,
  ErrorOutline,
  CheckCircleOutline,
} from "@mui/icons-material"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../components/auth/AuthContext"
import { motion } from "framer-motion"

// Import images
// Note: In a real implementation, you would have these files in your project
import logo from "../assets/HRSmileLogo.jpeg";
import banner from "../assets/Login.png"
import playstore from "../assets/playstore.png";
import appstore from "../assets/appstore.png";

const API_URL = "https://namami-infotech.com/SAFEGUARD/src/auth"

// Custom styled components
const GlassCard = ({ children, ...props }) => (
  <Paper
    elevation={4}
    sx={{
      background: "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(10px)",
      borderRadius: "16px",
      padding: "2rem",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      transition: "all 0.3s ease",
      "&:hover": {
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
      },
      ...props.sx,
    }}
    {...props}
  >
    {children}
  </Paper>
)

const StyledTextField = ({ ...props }) => (
  <TextField
    variant="outlined"
    fullWidth
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: "12px",
        transition: "all 0.3s ease",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.9)",
        },
        "&.Mui-focused": {
          backgroundColor: "rgba(255, 255, 255, 1)",
          boxShadow: "0 0 0 2px rgba(27, 49, 86, 0.2)",
        },
      },
      "& .MuiInputLabel-root": {
        transition: "all 0.3s ease",
      },
      my: 1.5,
    }}
    {...props}
  />
)

const StyledButton = ({ children, ...props }) => (
  <Button
    variant="contained"
    sx={{
      borderRadius: "12px",
      padding: "12px 24px",
      textTransform: "none",
      fontSize: "1rem",
      fontWeight: 600,
      transition: "all 0.3s ease",
      "&:hover": {
        transform: "translateY(-2px)",
      },
      ...props.sx,
    }}
    {...props}
  >
    {children}
  </Button>
)

export default function EnhancedLoginPage() {
  const [empId, setEmpId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotPasswordError, setForgotPasswordError] = useState("")
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [showSnackbar, setShowSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState("success")
  const [formValid, setFormValid] = useState(false)
  const [animate, setAnimate] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"))

  // Validate form
  useEffect(() => {
    setFormValid(empId.trim() !== "" && password.trim() !== "")
  }, [empId, password])

  // Animation on mount
  useEffect(() => {
    setAnimate(true)
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await axios.post(`${API_URL}/login.php`, {
        EmpId: empId,
        password: password,
      })

      if (response.data.success) {
        login(response.data.data)
        setSnackbarMessage("Login successful! Redirecting to dashboard...")
        setSnackbarSeverity("success")
        setShowSnackbar(true)

        setTimeout(() => {
          navigate("/dashboard")
        }, 1500)
      } else {
        setError(response.data.message)
        setSnackbarMessage(response.data.message || "Login failed")
        setSnackbarSeverity("error")
        setShowSnackbar(true)
      }
    } catch (error) {
      const errorMessage = "Network error. Please check your connection and try again."
      setError(errorMessage)
      setSnackbarMessage(errorMessage)
      setSnackbarSeverity("error")
      setShowSnackbar(true)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      setForgotPasswordError("Please enter a valid email address")
      return
    }

    setLoading(true)
    setForgotPasswordError("")
    setForgotPasswordSuccess("")

    try {
      const response = await axios.post(`${API_URL}/forget_password.php`, {
        email: forgotEmail,
      })

      if (response.data.success) {
        setForgotPasswordSuccess("Password reset instructions sent to your email")
        setSnackbarMessage("Password reset instructions sent to your email")
        setSnackbarSeverity("success")
        setShowSnackbar(true)

        setTimeout(() => {
          setOpenDialog(false)
        }, 2000)
      } else {
        setForgotPasswordError(response.data.message || "Email not found")
      }
    } catch (error) {
      setForgotPasswordError("Network error. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSnackbar = () => {
    setShowSnackbar(false)
  }

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "#f5f5f5",
      }}
    >
      <Grid
        container
        sx={{
          width: "100%",
          height: "100%",
          margin: 0,
          padding: 0,
        }}
      >
        {/* Left Side - Branding Area */}
        <Grid
          item
          xs={12}
          md={7}
          sx={{
            background: "linear-gradient(135deg, #8d0638ff 0%, #B81652 100%)",
            position: "relative",
            overflow: "hidden",
            display: { xs: "flex", md: "flex" },
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: { xs: 3, md: 5 },
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
              zIndex: 1,
            },
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: animate ? 1 : 0, y: animate ? 0 : 50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ zIndex: 2, textAlign: "center", width: "100%" }}
          >
            <Typography
              variant="h2"
              sx={{
                color: "white",
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                textShadow: "0px 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              SAFEGUARD HR
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: "white",
                mb: 4,
                fontWeight: 500,
                textShadow: "0px 1px 2px rgba(0,0,0,0.2)",
              }}
            >
              Complete HR Solution Tailor-made for Your Business
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: animate ? 1 : 0, scale: animate ? 1 : 0.9 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ zIndex: 2, maxWidth: "100%" }}
          >
            <img
              src={banner || "/placeholder.svg"}
              alt="HR Smile Banner"
              style={{
                maxWidth: "100%",
                height: "auto",
                maxHeight: isMobile ? "300px" : "400px",
                filter: "drop-shadow(0px 10px 20px rgba(0,0,0,0.25))",
                borderRadius: "12px",
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: animate ? 1 : 0, y: animate ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            style={{ zIndex: 2, marginTop: "2rem", textAlign: "center" }}
          >
            <Typography
              variant="body1"
              sx={{
                color: "white",
                mb: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <span style={{ fontSize: "0.8rem" }}>by</span>
              <Link
                to="https://namami-infotech.com/"
                target="_blank"
                style={{
                  textDecoration: "none",
                  color: "white",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#DF9622")}
                onMouseOut={(e) => (e.currentTarget.style.color = "white")}
              >
                Namami Infotech India Pvt. Ltd.
              </Link>
            </Typography>
          </motion.div>
        </Grid>

        {/* Right Side - Login Form */}
        <Grid
          item
          xs={12}
          md={5}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 0,
            margin: 0,
            position: "relative",
            background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)",
            height: "100%",
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: animate ? 1 : 0, x: animate ? 0 : 50 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ width: "80%", height: "100%" }}
          >
            <GlassCard
              sx={{
                width: "100%",
                height: "90%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: { xs: "2rem", sm: "3rem" },
                margin: 0,
                borderRadius: 0,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <img
                  src={logo || "/placeholder.svg"}
                  alt="HR Smile Logo"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "contain",
                    marginBottom: "1rem",
                    filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.1))",
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "#8d0638ff",
                    mb: 0.5,
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.secondary",
                    textAlign: "center",
                  }}
                >
                  Sign in to access your HR dashboard
                </Typography>
              </Box>

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    borderRadius: "8px",
                    animation: "shake 0.5s",
                    "@keyframes shake": {
                      "0%, 100%": { transform: "translateX(0)" },
                      "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
                      "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
                    },
                  }}
                  icon={<ErrorOutline />}
                >
                  {error}
                </Alert>
              )}

              <form onSubmit={handleLogin}>
                <StyledTextField
                  label="Employee ID"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="#8d0638ff" />
                      </InputAdornment>
                    ),
                  }}
                  autoComplete="username"
                />

                <StyledTextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="#8d0638ff" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="large"
                          sx={{ color: showPassword ? "primary.main" : "text.secondary" }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  autoComplete="current-password"
                />

                <Box sx={{ mt: 1, mb: 3, textAlign: "right" }}>
                  <Button
                    onClick={() => setOpenDialog(true)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                      color: "text.secondary",
                      "&:hover": {
                        color: "primary.main",
                        background: "transparent",
                      },
                    }}
                    startIcon={<LockReset fontSize="small" />}
                  >
                    Forgot Password?
                  </Button>
                </Box>

                <StyledButton
                  type="submit"
                  fullWidth
                  disabled={loading || !formValid}
                  endIcon={loading ? undefined : <ArrowForward />}
                  sx={{ mt: 1 }}
                >
                  {loading ? (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                      Signing In...
                    </Box>
                  ) : (
                    "Sign In"
                  )}
                </StyledButton>
              </form>

              <Box sx={{ mt: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Get the HR Smile mobile app
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Tooltip title="Download from Google Play Store" arrow TransitionComponent={Zoom}>
                    <Link to="https://play.google.com/store/apps/details?id=com.nanami.hrsmile" target="_blank">
                      <img
                        src={playstore || "/placeholder.svg"}
                        alt="Google Play Store"
                        style={{
                          height: "40px",
                          cursor: "pointer",
                          transition: "transform 0.3s ease",
                          filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      />
                    </Link>
                  </Tooltip>

                  <Tooltip title="Download from Apple App Store" arrow TransitionComponent={Zoom}>
                    <Link to="https://apps.apple.com/in/app/hr-smile/id6738949653" target="_blank">
                      <img
                        src={appstore || "/placeholder.svg"}
                        alt="Apple App Store"
                        style={{
                          height: "40px",
                          cursor: "pointer",
                          transition: "transform 0.3s ease",
                          filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      />
                    </Link>
                  </Tooltip>
                </Box>
              </Box>
            </GlassCard>
          </motion.div>
        </Grid>
      </Grid>

      {/* Forgot Password Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => !loading && setOpenDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            padding: "8px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          },
        }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LockReset color="#8d0638ff" />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Reset Your Password
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your email address and we'll send you instructions to reset your password.
          </Typography>

          {forgotPasswordError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }} icon={<ErrorOutline />}>
              {forgotPasswordError}
            </Alert>
          )}

          {forgotPasswordSuccess && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: "8px" }} icon={<CheckCircleOutline />}>
              {forgotPasswordSuccess}
            </Alert>
          )}

          <StyledTextField
            label="Email Address"
            type="email"
            fullWidth
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            disabled={loading || forgotPasswordSuccess !== ""}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="#8d0638ff" />
                </InputAdornment>
              ),
            }}
            autoComplete="email"
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            disabled={loading}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>

          <StyledButton
            onClick={handleForgotPassword}
            disabled={loading || !forgotEmail || forgotPasswordSuccess !== ""}
            startIcon={loading ? <CircularProgress size={20} /> : <LockReset />}
          >
            {loading ? "Sending..." : "Reset Password"}
          </StyledButton>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        TransitionComponent={Grow}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{
            width: "100%",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
