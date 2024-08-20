import React, { useState } from 'react';
import { Button } from '@mui/material';
import './RoleActions.css'; // Import the CSS file
import { createModule, createRole } from '../../API/RolesApi';
import { Role, Module, Permission, Task } from '../../RoleTypes';
import AddTaskDialog from '../add-task-dialog/AddTaskDialog';

interface RoleActionsProps {
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
  setPermissions: React.Dispatch<React.SetStateAction<Permission[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  roles: Role[];
  tasks: Task[];
  modules: Module[];
}

const RoleActions: React.FC<RoleActionsProps> = ({
  setRoles,
  setModules,
  setPermissions,
  setTasks,
  roles,
  tasks,
  modules,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleNewRole = async (): Promise<void> => {
    const name = prompt('Please enter new role name:');
    if (name !== null && name.trim()) {
      try {
        const response = await createRole({ name });
        const newRole: Role = {
          id: response.data.id,
          name: response.data.name,
          _id: response.data._id,
        };

        setRoles((prevRoles) => [...prevRoles, newRole]);

        const newPermissions: Permission[] = tasks.map((task) => ({
          id: `${newRole.id}_${task.id}`,
          roleId: newRole.id,
          taskId: task.id,
          enable: false,
        }));

        setPermissions((prevPermissions) => [
          ...prevPermissions,
          ...newPermissions,
        ]);

        console.log('Role created successfully');
      } catch (error) {
        console.error('Failed to create role', error);
      }
    }
  };

  const handleNewModule = async (): Promise<void> => {
    const name = prompt('Please enter new module name:');
    if (name !== null && name.trim()) {
      try {
        const response = await createModule({
          name,
          value: name.toLowerCase(),
        });

        const newModule: Module = {
          id: response.data.id,
          name: response.data.name,
          value: response.data.value,
          _id: response.data._id,
        };

        setModules((prevModules) => [...prevModules, newModule]);

        console.log('Module created successfully');
      } catch (error) {
        console.error('Failed to create module', error);
      }
    }
  };

  const handleNewTask = (): void => {
    setIsModalOpen(true);
  };

  return (
    <div className="role-actions-box">
      <Button
        variant="outlined"
        onClick={handleNewRole}
        className="role-action-btn"
      >
        Add New Role
      </Button>
      <Button
        variant="outlined"
        onClick={handleNewModule}
        className="role-action-btn"
      >
        Add New Module
      </Button>
      <Button
        variant="outlined"
        onClick={handleNewTask}
        className="role-action-btn"
      >
        Add New Task
      </Button>

      {isModalOpen && (
        <AddTaskDialog
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          modules={modules}
          roles={roles}
          setTasks={(newTasks) =>
            setTasks((prevTasks) => [...prevTasks, ...(newTasks as Task[])])
          }
          setPermissions={(newPermissions) =>
            setPermissions((prevPermissions) => [
              ...prevPermissions,
              ...(newPermissions as Permission[]),
            ])
          }
        />
      )}
    </div>
  );
};

export default RoleActions;
