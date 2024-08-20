import axios from "axios";

export const API_URL = 'http://localhost:5000/cargo/aco';

export interface AirportCargo {
    _id?: string;
    acoCode: string;
    acoName: string;
    acoAddress: string;
    airportCode: string;
    pincode: string;
    emailId: string;
    mobileNumber: string;
  }

  export const fetchAirportCargos = async (): Promise<AirportCargo[]> => {
    try {
      const response = await axios.get<AirportCargo[]>(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching airport cargos:', error);
      throw error;
    }
  };
  
  export const deleteAirportCargo = async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
      console.error('Error deleting airport cargo:', error);
      throw error;
    }
  };
  
  export const addAirportCargo = async (cargo: AirportCargo): Promise<AirportCargo> => {
    try {
      const response = await axios.post<AirportCargo>(API_URL, cargo);
      return response.data;
    } catch (error) {
      console.error('Error adding airport cargo:', error);
      throw error;
    }
  };
  
  export const updateAirportCargo = async (id: string, cargo: AirportCargo): Promise<void> => {
    try {
      await axios.put(`${API_URL}/${id}`, cargo);
    } catch (error) {
      console.error('Error updating airport cargo:', error);
      throw error;
    }
  };
  export const fetchAirportCargoById = async (id: string): Promise<AirportCargo> => {
    try {
      const response = await axios.get<AirportCargo>(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching airport master by ID:', error);
      throw error;
    }
  };