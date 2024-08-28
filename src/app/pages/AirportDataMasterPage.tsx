import HasAccess from "../context/HasAccess";
import { AirportDataMaster } from "../features/airportData-master";


const AirportDataMasterPage = () => {
  return (
    <HasAccess requiredPermission="VIEW_AIRPORT_MASTER">
      <AirportDataMaster />
    </HasAccess>
  );
};

export default AirportDataMasterPage;
