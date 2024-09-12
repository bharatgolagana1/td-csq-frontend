import HasAccess from "../context/HasAccess"
import { Dashboard } from "../features/dashboard"

const DashboardPage = () => {
  return (
    <div style={{marginTop:'40px'}}>
      <HasAccess requiredPermission="VIEW_DASHBOARD" >
      <Dashboard/>
      </HasAccess>
    </div>
  )
}

export default DashboardPage
