import axios from 'axios';

export const API_URL = 'http://localhost:5000/air/airports';

export interface AirportMaster {
    _id: string;
    airportCode: string;
    airportName: string;
    cityCode: string;
    cityName: string;
    countryCode: string;
    countryName: string;
    regionCode: string;
    regionName: string;
    latitude?: number | null;
    longitude?: number | null;
  }
  
export const fetchAirportMasters = async (): Promise<AirportMaster[]> => {
  try {
    const response = await axios.get<AirportMaster[]>(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching airport masters:', error);
    throw error;
  }
};

export const addAirportMaster = async (data: AirportMaster): Promise<AirportMaster> => {
  try {
    const response = await axios.post<AirportMaster>(API_URL, data);
    return response.data;
  } catch (error) {
    console.error('Error adding airport master:', error);
    throw error;
  }
};

export const updateAirportMaster = async (_id: string, updatedData: Partial<AirportMaster>) => {
  try {
    const response = await axios.put(`${API_URL}/${_id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error updating airport master:', error);
    throw error;
  }
};

export const deleteAirportMaster = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error('Error deleting airport master:', error);
    throw error;
  }
};

export const fetchAirportMasterById = async (_id: string): Promise<AirportMaster> => {
  try {
    const response = await axios.get<AirportMaster>(`${API_URL}/${_id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching airport master by ID:', error);
    throw error;
  }
};
