import axios from 'axios';

export const API_URL = 'http://localhost:5000/air/airports';

export interface AirportMaster {
  _id?: string;
  airportCode: string;
  airportName: string;
  cityCode: string;
  cityName: string;
  countryCode: string;
  countryName: string;
  regionCode: string;
  regionName: string;
  latitude: number;
  longitude: number;
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

export const updateAirportMaster = async (data: AirportMaster): Promise<AirportMaster> => {
  try {
    const response = await axios.put<AirportMaster>(`${API_URL}/${data._id}`, data);
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
export const fetchAirportMasterById = async (id: string): Promise<AirportMaster> => {
  try {
    const response = await axios.get<AirportMaster>(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching airport master by ID:', error);
    throw error;
  }
};