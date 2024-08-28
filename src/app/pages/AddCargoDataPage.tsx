import HasAccess from "../context/HasAccess"
import AirportCargoMasterForm from "../features/airportCargo-master/components/airportCargoMasterForm/AirportCargoMasterForm"

const AddCargoDataPage = () => {
  return (
    <div>
      <HasAccess requiredPermission="ADD_CARGO_DATA">
         <AirportCargoMasterForm/>
      </HasAccess>
    </div>
  )
}

export default AddCargoDataPage
