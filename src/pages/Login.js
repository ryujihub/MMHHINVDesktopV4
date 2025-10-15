import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Store as StoreIcon,
  Lock as LockIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../contexts/AuthContext.js';



const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [correctCaptchaAnswer, setCorrectCaptchaAnswer] = useState(0);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);
  const { login } = useAuth();

  // Handle reCAPTCHA verification
  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  // Handle reCAPTCHA expiry
  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null);
  };

  // Generate CAPTCHA question
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const question = `${num1} + ${num2}`;
    setCaptchaQuestion(question);
    setCorrectCaptchaAnswer(num1 + num2);
    setCaptchaAnswer('');
  };

  // Generate initial CAPTCHA on component mount
  React.useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate CAPTCHA first
    const userAnswer = parseInt(captchaAnswer);
    if (!userAnswer || userAnswer !== correctCaptchaAnswer) {
      setError('Please solve the security question correctly');
      generateCaptcha(); // Generate new CAPTCHA on failure
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message);
        generateCaptcha(); // Generate new CAPTCHA on login failure
      }
    } catch (error) {
      setError('An unexpected error occurred');
      generateCaptcha(); // Generate new CAPTCHA on error
    } finally {
      setLoading(false);
    }
  };



  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo and Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
              }}
            >
              <StoreIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
              Metro Manila Hills Hardware
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b' }}>
              Inventory Management System
            </Typography>
          </Box>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
                         <TextField
               fullWidth
               label="Email"
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               margin="normal"
               required
               InputProps={{
                 startAdornment: (
                   <InputAdornment position="start">
                     <LockIcon color="action" />
                   </InputAdornment>
                 ),
               }}
             />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Simple Math CAPTCHA for now */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon fontSize="small" />
                Security Question
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  label="Solve the question"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Enter the answer"
                  type="number"
                  required
                  helperText={captchaQuestion ? `What is ${captchaQuestion}?` : 'Solve the math question above'}
                />
                <Button
                  type="button"
                  variant="outlined"
                  size="small"
                  onClick={generateCaptcha}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  ↻
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !captchaAnswer}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                backgroundColor: '#3b82f6',
                '&:hover': {
                  backgroundColor: '#2563eb'
                }
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

        </CardContent>
      </Card>

    </Box>
  );
};

export default Login;
