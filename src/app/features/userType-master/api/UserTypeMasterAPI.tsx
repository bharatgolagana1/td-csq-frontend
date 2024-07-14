import axios from 'axios';

export const API_URL = 'http://localhost:5000/user/data';

export interface UserType {
  _id?: string; // Make _id optional
  id?: number;  // Make id optional
  userType: string;
  accFlag: string;
}

export const fetchUserTypes = async (): Promise<UserType[]> => {
  const response = await axios.get<UserType[]>(API_URL);
  return response.data;
};

export const addUserType = async (userType: Omit<UserType, '_id' | 'id'>): Promise<UserType> => {
  try {
    const response = await axios.post<UserType>(API_URL, userType);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error adding user type:', error.response?.data || error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
};

export const updateUserType = async (userType: UserType): Promise<UserType> => {
  try {
    const response = await axios.put<UserType>(`${API_URL}/${userType._id}`, userType);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error updating user type:', error.response?.data || error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
};

export const deleteUserType = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error deleting user type:', error.response?.data || error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
};
