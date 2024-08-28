import axios from 'axios';

export interface Parameter {
  _id: string;
  category: string;
  subCategory: string;
  parameter: string;
  frequency: string;
  weightage: number;
  subParameters?: SubParameter[];
}

export interface SubParameter {
  _id: string;
  name: string;
}

export interface ErrorState {
  category?: string;
  subCategory?: string;
  parameter?: string;
  frequency?: string;
  weightage?: string;
  subParameterName?: string;
}


export const API_URL = 'http://localhost:5000/feedback/feedbacks';

export const fetchParameters = async (): Promise<Parameter[]> => {
  const response = await axios.get<Parameter[]>(API_URL);
  return response.data;
};

export const addParameter = async (parameter: Parameter): Promise<Parameter> => {
  const response = await axios.post<Parameter>(API_URL, parameter);
  return response.data;
};

export const editParameter = async (_p0: string, parameter: Parameter): Promise<void> => {
  await axios.put(`${API_URL}/${parameter._id}`, parameter);
};

export const deleteParameter = async (parameterId: string): Promise<void> => {
  await axios.delete(`${API_URL}/${parameterId}`);
};

export const fetchSubParameters = async (parameterId: string): Promise<SubParameter[]> => {
  const response = await axios.get<SubParameter[]>(`${API_URL}/${parameterId}/subparameters`);
  return response.data;
};

export const addSubParameter = async (parameterId: string, subParameter: SubParameter): Promise<SubParameter> => {
  const response = await axios.post<SubParameter>(`${API_URL}/${parameterId}/subparameters`, subParameter);
  return response.data;
};

export const editSubParameter = async (parameterId: string, subParameter: SubParameter): Promise<SubParameter> => {
  const response = await axios.put<SubParameter>(`${API_URL}/${parameterId}/subparameters/${subParameter._id}`, subParameter);
  return response.data;
};

export const deleteSubParameter = async (parameterId: string, subParameterId: string): Promise<void> => {
  await axios.delete(`${API_URL}/${parameterId}/subparameters/${subParameterId}`);
};
