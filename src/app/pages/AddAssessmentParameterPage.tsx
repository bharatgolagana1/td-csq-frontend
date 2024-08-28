import HasAccess from "../context/HasAccess";
import ParameterForm from "../features/assessment-questions/components/ParameterForm/ParameterForm";

const AddAssessmentParameterPage = () => {
  return (
    <div>
      <HasAccess requiredPermission="ADD_AIRPORT_DATA">
        <ParameterForm/>
      </HasAccess>
    </div>
  );
};

export default AddAssessmentParameterPage;
