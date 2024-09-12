import HasAccess from "../../context/HasAccess"
import UserMasterForm from "../../features/userMaster/components/userMasterForm/UserMasterForm"

const AddUserMasterPage = () => {
  return (
    <div>
      <HasAccess requiredPermission="ADD_USER">
      <UserMasterForm/>
      </HasAccess>
    </div>
  )
}

export default AddUserMasterPage
