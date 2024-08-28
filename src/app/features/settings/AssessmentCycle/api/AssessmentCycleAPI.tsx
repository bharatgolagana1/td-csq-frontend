// features/assessmentCycle/api/assessmentCycleApi.ts
import axios from 'axios';

// Base URL for the API
const BASE_URL = "http://localhost:5000/assessment";

/**
 * Get all assessment cycles with optional filters.
 * @param filters - Optional filters to apply when fetching assessment cycles.
 * @returns A promise that resolves with the fetched assessment cycles.
 */
export const getAssessmentCycles = async (filters?: any) => {
  const response = await axios.get(`${BASE_URL}/Cycle`, { params: filters });
  return response.data;
};

/**
 * Add a new assessment cycle.
 * @param cycleData - The data of the assessment cycle to add.
 * @returns A promise that resolves with the created assessment cycle.
 */
export const addAssessmentCycle = async (cycleData: any) => {
  const response = await axios.post(`${BASE_URL}/Cycle`, cycleData);
  return response.data;
};

/**
 * Update an existing assessment cycle.
 * @param cycleId - The ID of the assessment cycle to update.
 * @param updatedData - The updated data for the assessment cycle.
 * @returns A promise that resolves with the updated assessment cycle.
 */
export const updateAssessmentCycle = async (cycleId: string, updatedData: any) => {
  const response = await axios.put(`${BASE_URL}/Cycle/${cycleId}`, updatedData);
  return response.data;
};

/**
 * Delete multiple assessment cycles.
 * @param ids - An array of IDs of the assessment cycles to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deleteAssessmentCycles = async (ids: string[]) => {
  const response = await axios.delete(`${BASE_URL}/Cycles`, { data: { ids } });
  return response.data;
};

/**
 * Get a single assessment cycle by its ID.
 * @param cycleId - The ID of the assessment cycle to fetch.
 * @returns A promise that resolves with the fetched assessment cycle.
 */
export const getAssessmentCycleById = async (cycleId: string) => {
  const response = await axios.get(`${BASE_URL}/Cycle/${cycleId}`);
  return response.data;
};
