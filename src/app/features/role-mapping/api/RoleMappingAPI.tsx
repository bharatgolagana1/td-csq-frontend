import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Replace with your backend URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Module APIs
export const getModules = async () => apiClient.get('/modules');
export const getModuleById = async (id: string) => apiClient.get(`/modules/${id}`);
export const createModule = async (data: any) => apiClient.post('/modules', data);

// Task APIs
export const getTasks = async () => apiClient.get('/tasks');
export const getTasksByModuleId = async (moduleId: string) => apiClient.get(`/tasks/module/${moduleId}`);
export const createTask = async (data: any) => apiClient.post('/tasks', data);

// Role APIs
export const getRoles = async () => apiClient.get('/roles');
export const getRoleById = async (id: string) => apiClient.get(`/roles/${id}`);
export const createRole = async (data: any) => apiClient.post('/roles', data);

// Permission APIs
export const getAllPermissions = async () => apiClient.get('/permissions');
export const getPermissionsByRole = async (roleId: string) => apiClient.get(`/permissions/role/${roleId}`);
export const updatePermissions = async (data: any) => axios.put('http://localhost:5000/permissions', data);