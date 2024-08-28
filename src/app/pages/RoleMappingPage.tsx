import HasAccess from "../context/HasAccess";
import RoleMapping from "../features/role-mapping/RoleMapping";

const RoleMappingPage = () => {
  return (
    <div>
      <HasAccess requiredPermission="MANAGE_ROLES">
      <RoleMapping/>
      </HasAccess>
    </div>
  )
}

export default RoleMappingPage;
