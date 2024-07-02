import React, { useState } from 'react';
import { z } from 'zod';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginFormSchema = z.object({
  userName: z.string().min(3, "User Name is required"),
  password: z.string().min(12, "min 12 character Password is required"),
});

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ userName: '', password: '' });
  const [errors, setErrors] = useState<any>({});
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      LoginFormSchema.parse(formData);
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      if (response.status === 200) {
        alert('Form submitted successfully!');
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: any = {};
        error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } else if (axios.isAxiosError(error)) {
        // Handle Axios errors
        alert('Failed to submit the form. Please try again.');
      }
    }
  };

  const handleCreate = () => {
    navigate('/register');
  }

  return (
    <>
      <div className='body2'>
        <div style={{ border: '2px solid white', background: 'white' }}>
          <div className='logo-dem'>
            <img src="https://res.cloudinary.com/dau1qydx2/image/upload/v1718550397/CSQ-icon_ajtcnz.png" alt="Logo" className="logo" />
            <h2>Sign In</h2>
          </div>
          <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  name="userName"
                  placeholder="User Name"
                  value={formData.userName}
                  onChange={handleChange}
                />
                {errors.userName && <p className="error">{errors.userName}</p>}
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && <p className="error">{errors.password}</p>}
              </div>
              <a href="#" className="forgot-password">Forgot your password?</a>
              <button type="submit" className="btn submit-btn">Submit</button>
              <button type="button" className="btn create-account-btn" onClick={handleCreate}>Create Account</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
