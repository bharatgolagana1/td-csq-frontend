import HasAccess from "../context/HasAccess";
import AddAirportDataMasterForm from "../features/airportData-master/components/AirportDataMasterForm/AddAirportDataMasterForm";

const AddAirportDataPage = () => {
  return (
    <div>
      <HasAccess requiredPermission="ADD_AIRPORT_DATA">
        <AddAirportDataMasterForm />
      </HasAccess>
    </div>
  );
};

export default AddAirportDataPage;
