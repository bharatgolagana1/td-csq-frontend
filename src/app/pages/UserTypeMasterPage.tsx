import HasAccess from "../context/HasAccess"
import { UserTypeMaster } from "../features/userType-master"

const UserTypeMasterPage = () => {
  return (
    <div>
      <HasAccess requiredPermission="MANAGE_USER_TYPE">
      <UserTypeMaster/>
      </HasAccess>
    </div>
  )
}

export default UserTypeMasterPage
