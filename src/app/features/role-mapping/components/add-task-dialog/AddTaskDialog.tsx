import React, { useState, useRef } from 'react';
import './AddTaskDialog.css';
import { createTask } from '../../api/RoleMappingAPI';
import { Module, Role, Task, Permission } from '../../RoleTypes';

interface AddTaskDialogProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modules: Module[];
  roles: Role[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setPermissions: React.Dispatch<React.SetStateAction<Permission[]>>;
  onTaskCreated: () => void; // New prop to trigger refetch after task creation
}

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
  isModalOpen,
  setIsModalOpen,
  modules,
  roles,
  setTasks,
  setPermissions,
  onTaskCreated, // Destructure the new prop
}) => {
  const [selModule, setSelModule] = useState<string>(modules[0]?._id || '');
  const taskNameRef = useRef<HTMLInputElement>(null);
  const taskValueRef = useRef<HTMLInputElement>(null);

  const handleModuleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelModule(event.target.value);
  };

  const handleTaskSave = async (): Promise<void> => {
    if (taskNameRef.current && taskValueRef.current && selModule) {
      const taskName = taskNameRef.current.value.trim();
      const taskValue = taskValueRef.current.value.trim();

      if (!taskName || !taskValue) {
        console.error('Task Name and Task Value are required.');
        return;
      }

      const newTask = {
        name: taskName,
        task_value: taskValue,
        moduleId: selModule,
      };

      try {
        const response = await createTask(newTask);

        const createdTask: Task = {
          _id: response.data._id,
          ...newTask,
          task_value: response.data.value,
        };

        setTasks((prevTasks) => [...prevTasks, createdTask]);

        const newPermissions: Permission[] = roles.map((role) => ({
          id: `${role._id}_${createdTask._id}`,
          roleId: role._id,
          taskId: createdTask._id,
          enable: false,
        }));

        setPermissions((prevPermissions) => [
          ...prevPermissions,
          ...newPermissions,
        ]);

        console.log('Task created successfully');
        onTaskCreated(); // Trigger refetch or UI update
      } catch (error) {
        console.error('Failed to create task', error);
      } finally {
        setIsModalOpen(false);
      }
    } else {
      console.error('Task Name, Task Value, and Module ID are required.');
    }
  };

  return (
    isModalOpen && (
      <div className="add-task-dialog modal open">
        <div className="modal-content">
          <h2>Add Task</h2>
          <div className="form-group">
            <label>Select Module</label>
            <select value={selModule} onChange={handleModuleChange}>
              {modules.map((module) => (
                <option key={module._id} value={module._id}>
                  {module.name}
                </option>
              ))}
            </select>
          </div>

          {selModule && (
            <>
              <div className="form-group">
                <label>Task Name</label>
                <input type="text" ref={taskNameRef} />
              </div>
              <div className="form-group">
                <label>Task Value</label>
                <input type="text" ref={taskValueRef} />
              </div>
            </>
          )}
          <div className="modal-actions">
            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button onClick={handleTaskSave} disabled={!selModule}>
              Save
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default AddTaskDialog;