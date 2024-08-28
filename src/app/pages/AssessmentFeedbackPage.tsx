import HasAccess from "../context/HasAccess";
import { AssessmentFeedback } from "../features/assessment-feedback";

const AssessmentFeedbackPage = () => {
  return (
    <HasAccess requiredPermission="VIEW_ASSESSMENT_FEEDBACKS">
      <AssessmentFeedback />
    </HasAccess>
  );
}

export default AssessmentFeedbackPage;
