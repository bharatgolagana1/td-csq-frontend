import axios from "axios";

export const API_URL = 'http://localhost:5000/customer/customer';

export const fetchCustomers = async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      throw new Error('Error fetching customers');
    }
  };
  
  export const fetchAssessmentCycle = async () => {
    try {
      const response = await axios.get('http://localhost:5000/assessment/Cycle');
      return response.data;
    } catch (error) {
      throw new Error('Error fetching assessment cycle');
    }
  };
  
  export const addCustomer = async (customer: any) => {
    try {
      const response = await axios.post(API_URL, customer);
      return response.data;
    } catch (error) {
      throw new Error('Error adding customer');
    }
  };
  
  export const updateCustomer = async (id: string, customer: any) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, customer);
      return response.data;
    } catch (error) {
      throw new Error('Error updating customer');
    }
  };
  
  export const deleteCustomer = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
      throw new Error('Error deleting customer');
    }
  };