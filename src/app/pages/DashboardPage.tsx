import HasAccess from "../context/HasAccess"
import Dashboard from "../features/dashboard/components/Dashboard/Dashboard"

const DashboardPage = () => {
  return (
    <div>
      <HasAccess requiredPermission="VIEW_DASHBOARD">
      <Dashboard/>
      </HasAccess>
      
    </div>
  )
}

export default DashboardPage
