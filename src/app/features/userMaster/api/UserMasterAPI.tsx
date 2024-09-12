import axios from 'axios';
import { User } from '../components/types';

const API_URL = 'http://localhost:5000/userType/data';

export const getAllUsers = async () => {
  const response = await axios.get<User[]>(API_URL);
  return response.data;
};

export const getUserById = async (id: string) => {
  const response = await axios.get<User>(`${API_URL}/${id}`);
  return response.data;
};

export const addUser = async (user: User) => {
  const response = await axios.post(API_URL, user);
  return response.data;
};

export const updateUser = async (id: string, user: User) => {
  const response = await axios.put(`${API_URL}/${id}`, user);
  return response.data;
};

export const deleteUser = async (id: string) => {
  await axios.delete(`${API_URL}/${id}`);
};

export const bulkUploadUsers = async (file: FormData) => {
  const response = await axios.post(`${API_URL}/bulk-upload`, file, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteMultipleUsers = async (ids: string[]) => {
  const response = await axios.delete(API_URL, { data: { ids } });
  return response.data;
};
