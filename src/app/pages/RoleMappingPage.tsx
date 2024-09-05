import HasAccess from "../context/HasAccess";
import { RoleMapping } from "../features/role-mapping";


const RoleMappingPage = () => {
  return (
    <div style={{marginTop:'40px'}}>
      <HasAccess requiredPermission="MANAGE_ROLES">
      <RoleMapping/>
      </HasAccess>
    </div>
  )
}

export default RoleMappingPage;