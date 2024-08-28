import HasAccess from "../context/HasAccess"
import { AirportCargoMaster } from "../features/airportCargo-master"

const AirportCargoMasterPage = () => {
  return (
    <div>
      <HasAccess requiredPermission="VIEW_AIRPORT_CARGO">
      <AirportCargoMaster/>
      </HasAccess>
    </div>
  )
}

export default AirportCargoMasterPage
