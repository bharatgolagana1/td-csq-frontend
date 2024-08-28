import HasAccess from "../context/HasAccess"
import { CustomerSampling } from "../features/customer-sampling"

const CustomerSamplingPage = () => {
  return (
    <div>
      <HasAccess requiredPermission="VIEW_CUSTOMER_SAMPLING">
        <CustomerSampling/>
      </HasAccess>
      
    </div>
  )
}

export default CustomerSamplingPage
