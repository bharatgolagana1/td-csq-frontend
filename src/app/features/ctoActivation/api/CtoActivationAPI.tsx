import axios from 'axios';

export interface CtoActivationData {
  requestId: number;
  assignedDate: string;
  requestFor: string;
  requestType: string;
  email: string;
  mobile: string;
  nonMember: string;
  comments: string;
}

// Base URL for your API
const API_BASE_URL = 'http://localhost:5000/cto';

// Function to add a new CTO Activation
export const addCtoActivation = async (ctoActivationData: CtoActivationData): Promise<CtoActivationData> => {
  try {
    const response = await axios.post<CtoActivationData>(`${API_BASE_URL}/Activation`, ctoActivationData);
    return response.data;
  } catch (error:any) {
    throw new Error(error.response?.data?.message || 'Error adding CTO Activation');
  }
};

// Function to get a CTO Activation by ID
export const getCtoActivationById = async (id: number): Promise<CtoActivationData> => {
  try {
    const response = await axios.get<CtoActivationData>(`${API_BASE_URL}/Activation/${id}`);
    return response.data;
  } catch (error:any) {
    throw new Error(error.response?.data?.message || 'Error retrieving CTO Activation');
  }
};

// Function to get all CTO Activations
export const getAllCtoActivations = async (): Promise<CtoActivationData[]> => {
  try {
    const response = await axios.get<CtoActivationData[]>(`${API_BASE_URL}/Activation`);
    return response.data;
  } catch (error:any) {
    throw new Error(error.response?.data?.message || 'Error retrieving all CTO Activations');
  }
};

// Function to update a CTO Activation by ID
export const updateCtoActivation = async (id: number, updatedData: Partial<CtoActivationData>): Promise<CtoActivationData> => {
  try {
    const response = await axios.put<CtoActivationData>(`${API_BASE_URL}/Activation/${id}`, updatedData);
    return response.data;
  } catch (error:any) {
    throw new Error(error.response?.data?.message || 'Error updating CTO Activation');
  }
};

// Function to delete a CTO Activation by ID
export const deleteCtoActivation = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/Activation/${id}`);
  } catch (error:any) {
    throw new Error(error.response?.data?.message || 'Error deleting CTO Activation');
  }
};

// Function to delete multiple CTO Activations by IDs
export const deleteCtoActivations = async (ids: number[]): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/Activations`, { data: { ids } });
  } catch (error:any) {
    throw new Error(error.response?.data?.message || 'Error deleting CTO Activations');
  }
};
