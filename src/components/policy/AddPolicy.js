"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import { CloudUpload, Policy } from "@mui/icons-material"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"

function AddPolicyDialog({ open, onClose, onPolicyAdded }) {
  const { user } = useAuth()
  const [policyName, setPolicyName] = useState("")
  const [policyDescription, setPolicyDescription] = useState("")
  const [pdfBase64, setPdfBase64] = useState("")
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please select a PDF file only")
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        setError("File size should be less than 10MB")
        return
      }

      setFileName(file.name)
      setError("")

      const reader = new FileReader()
      reader.onloadend = () => {
        setPdfBase64(reader.result.split(",")[1])
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    if (!policyName.trim()) {
      setError("Policy name is required")
      return false
    }
    if (!policyDescription.trim()) {
      setError("Policy description is required")
      return false
    }
    if (!pdfBase64) {
      setError("Please upload a PDF file")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await axios.post("https://namami-infotech.com/SAFEGUARD/src/policy/add_policy.php", {
        subject: policyName,
        body: policyDescription,
        pdf: pdfBase64,
        Tenent_Id: user?.tenent_id,
      })

      if (response.data.success) {
        setSuccess("Policy added successfully!")
        setTimeout(() => {
          onPolicyAdded()
          handleClose()
        }, 1500)
      } else {
        setError(response.data.message || "Failed to add policy")
      }
    } catch (error) {
      console.error("Error adding policy:", error)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setPolicyName("")
      setPolicyDescription("")
      setPdfBase64("")
      setFileName("")
      setError("")
      setSuccess("")
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { borderRadius: isMobile ? 0 : 2 },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Policy />
        Add New Policy
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Add a new company policy with description and PDF document.
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Policy Name"
            margin="normal"
            variant="outlined"
            value={policyName}
            onChange={(e) => setPolicyName(e.target.value)}
            placeholder="Enter policy name"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Policy Description"
            margin="normal"
            variant="outlined"
            multiline
            rows={4}
            value={policyDescription}
            onChange={(e) => setPolicyDescription(e.target.value)}
            placeholder="Enter detailed policy description"
            disabled={loading}
          />

          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Upload Policy Document (PDF)
            </Typography>
            <Box
              sx={{
                border: "2px dashed",
                borderColor: "grey.300",
                borderRadius: 1,
                p: 3,
                textAlign: "center",
                bgcolor: "grey.50",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "primary.50",
                },
              }}
            >
              <input
                accept="application/pdf"
                type="file"
                onChange={handleFileChange}
                style={{ display: "none" }}
                id="pdf-upload"
                disabled={loading}
              />
              <label htmlFor="pdf-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  disabled={loading}
                  sx={{ mb: 1 }}
                >
                  Choose PDF File
                </Button>
              </label>
              {fileName && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  Selected: {fileName}
                </Typography>
              )}
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Maximum file size: 10MB
              </Typography>
            </Box>
          </Box>
        </form>

        {/* Status Messages */}
        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 2, gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Adding policy...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained" sx={{ minWidth: 100 }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : "Add Policy"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddPolicyDialog
