import HasAccess from "../../context/HasAccess";
import CustomerSamplingForm from "../../features/customer-sampling/components/customerSamplingForm/CustomerSamplingForm"

const AddCustomerSamplingPage = () => {
  return (
    <div>
      <HasAccess requiredPermission="ADD_CUSTOMER_SAMPLING">
        <CustomerSamplingForm/>
      </HasAccess>  
    </div>
  )
}

export default AddCustomerSamplingPage;
