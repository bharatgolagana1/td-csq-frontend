import HasAccess from "../../context/HasAccess"
import AddAssessmentCycleForm from "../../features/assessmentCycle/components/AssessmentCycleForm/AssessmentCycleForm"

const AddAssessmentCyclePage = () => {
  return (
    <div>
      <HasAccess requiredPermission="ADD_ASSESSMENT">
       <AddAssessmentCycleForm/>
      </HasAccess>
    </div>
  )
}

export default AddAssessmentCyclePage
