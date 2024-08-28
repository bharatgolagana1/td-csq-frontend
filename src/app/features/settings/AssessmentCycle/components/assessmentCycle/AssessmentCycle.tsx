import AssessmentCycleTable from '../assessmentCycleTable/AssessmentCycleTable';
import { useNavigate } from 'react-router-dom';
import { Add as AddIcon } from '@mui/icons-material';
import './AssessmentCycle.css';

const AssessmentCycle = () => {
  const navigate = useNavigate();

  const handleAddCycle = () => {
    navigate('addCycle');
  };

  return (
    <div className="assessment-cycle-container">
      <div className="assessment-cycle-header">
        <h2 className="assessment-cycle-title">Assessment Cycle</h2>
        <button className="add-cycle-button" onClick={handleAddCycle}>
          <AddIcon className="add-icon" />
          <span className="add-cycle-text">Add Assessment Cycle</span>
        </button>
      </div>
      <AssessmentCycleTable />
    </div>
  );
};

export default AssessmentCycle;
