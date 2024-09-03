import axios from 'axios';

const API_URL = 'http://localhost:5000/customer/customer';

export interface Customer {
    _id: string;
    customerType: string;
    customerName: string;
    email: string;
    sampledDate: string;
    selectBox?: boolean;
  }
  
   export interface AssessmentCycle {
      minSamplingSize: number;
      samplingStartDate: string;
      samplingEndDate: string;
    }
    

export const fetchCustomers = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};


export const addCustomer = async (customer: Omit<Customer, '_id'>): Promise<Customer> => {
  try {
    const response = await axios.post<Customer>(API_URL, customer);
    return response.data;
  } catch (error) {
    console.error('Error adding customer:', error);
    throw new Error('Error adding customer');
  }
};

export const updateCustomer = async (id: string, customer: Customer): Promise<Customer> => {
  try {
    const response = await axios.put<Customer>(`${API_URL}/${id}`, customer);
    return response.data;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw new Error('Error updating customer');
  }
};

export const deleteCustomer = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw new Error('Error deleting customer');
  }
};

export const deleteCustomers = async (customerIds: string[]): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/all`, {
      data: { ids: customerIds }
    });
  } catch (error) {
    console.error('Error deleting customers:', error);
    throw new Error('Error deleting customers');
  }
};