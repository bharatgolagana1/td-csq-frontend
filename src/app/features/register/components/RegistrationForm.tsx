import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AssessDetails from './assessDetails/AssessDetails';
import OfficeDetails from './officeDetails/OfficeDetails';
import { z } from 'zod';
import { API_URL } from '../api/RegistrationAPI';

interface FormData {
  userType: string;
  ctoCode: string;
  nonMember: boolean;
  accountOwner: string;
  airport: string;
  ctoName: string;
  region: string;
  ctoMarketShare: number;
  referredBy: string;
  country:string;
  officeName :string;
  officeAddress: string;
  city: string;
  zipCode: string;
  mobileNumber: string;
  emailId: string;
  businessPhone : number;
}

const initialFormData: FormData = {
  userType: '',
  ctoCode: '',
  nonMember: false,
  accountOwner: '',
  airport: '',
  ctoName: '',
  region: '',
  ctoMarketShare: 0,
  referredBy: '',
  country:'',
  officeName :'',
  officeAddress: '',
  city: '',
  zipCode: '',
  mobileNumber: '',
  emailId: '',
  businessPhone : 0
};

const RegistrationFormSchema = z.object({
  userType: z.string().min(1, 'User type is required'),
  ctoCode: z.string().min(1, 'CTO code is required'),
  nonMember: z.boolean(),
  accountOwner: z.string().min(1, 'Account owner is required'),
  airport: z.string().min(1, 'Airport is required'),
  ctoName: z.string().min(1, 'CTO name is required'),
  region: z.string().min(1, 'Region is required'),
  ctoMarketShare: z.number().min(0, 'CTO market share must be a positive number'),
  referredBy: z.string().min(1, 'Referred by is required'),
  country:z.string().min(1, 'Country is required'),
  officeName : z.string().min(1, 'Office is required'),
  officeAddress: z.string().min(1, 'Office Address is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().min(1, 'Zip/Postal Code is required'),
  mobileNumber: z.string().min(10, 'Mobile Number is required'),
  emailId: z.string().email().min(1, 'Email is required'),
  businessPhone : z.string().min(1, 'Business Phone is required')
});

const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
  
    // Handle checkbox separately
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? parseFloat(value) : value;
  
    setFormData({
      ...formData,
      [name]: newValue,
    });
  };
  
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      RegistrationFormSchema.parse(formData);
      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 200 || response.status === 201) {
        alert('Form submitted successfully!');
        navigate('/');
      } else {
        alert('Failed to submit the form. Unexpected response from the server.');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
      } else if (axios.isAxiosError(error)) {
        alert('Failed to submit the form. Please try again.');
      }
    }
  };

  return (
    <div>
      <div className="logo-and-title">
        <img
          src="https://res.cloudinary.com/dau1qydx2/image/upload/v1718276184/csq_ymdxbk.jpg"
          alt="logo"
          width="60"
          height="50"
        />
        <h2 className="register">REGISTRATION FORM</h2>
      </div>
      <form className="registration-form" onSubmit={handleSubmit}>
        <AssessDetails handleChange={handleChange} formData={formData} errors={errors} />
        <OfficeDetails handleChange={handleChange} formData={formData} errors={errors} />
        <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
          <button type="submit" className="submit">
            Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;
