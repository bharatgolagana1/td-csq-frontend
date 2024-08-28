import HasAccess from "../context/HasAccess";
import AssessmentQuestionsData from "../features/assessment-questions/components/AssessmentQuestions/AssessmentQuestions";

const AssessmentQuestionsPage = () => {
  return (
    <HasAccess requiredPermission="VIEW_ASSESSMENT_QUESTIONS">
      <AssessmentQuestionsData />
    </HasAccess>
  );
}

export default AssessmentQuestionsPage;
