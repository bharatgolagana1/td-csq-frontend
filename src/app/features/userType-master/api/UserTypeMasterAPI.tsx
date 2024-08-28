import axios from 'axios';

export const API_URL = 'http://localhost:5000/userType/data';

export interface UserMaster {
  _id?: string;
  userid?: number;
  userType: string;
  userName: string;
  email: string;
  mobileNo: number;
  officeName: string;
  officeAddress: string;
  city: string;
  country: string;
}

// Fetch all user data
export const fetchUserMasters = async (): Promise<UserMaster[]> => {
  const response = await axios.get<UserMaster[]>(API_URL);
  return response.data;
};

// Add a new user
export const addUserMaster = async (userMaster: Omit<UserMaster, '_id' | 'userid'>): Promise<UserMaster> => {
  try {
    const response = await axios.post<UserMaster>(API_URL, userMaster);
    return response.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

// Update a user
export const updateUserMaster = async (userMaster: UserMaster): Promise<UserMaster> => {
  try {
    const response = await axios.put<UserMaster>(`${API_URL}/${userMaster._id}`, userMaster);
    return response.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

// Delete a user
export const deleteUserMaster = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    handleError(error);
    throw error;
  }
};

// **Delete multiple users**
export const deleteUserMasters = async (ids: string[]): Promise<void> => {
  try {
    await axios.delete(API_URL, { data: { ids } });
  } catch (error) {
    handleError(error);
    throw error;
  }
};

// Handle API errors
const handleError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    console.error('Error:', error.response?.data || error.message);
  } else {
    console.error('Unexpected error:', error);
  }
};
