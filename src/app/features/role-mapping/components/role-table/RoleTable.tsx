import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Box,
  Paper,
} from '@mui/material';
import { Role, Task, Permission } from '../../RoleTypes';
import { getModules } from '../../API/RolesApi';
import './RoleTable.css';

interface Module {
  _id: string;
  name: string;
}

interface RoleTableProps {
  roles: Role[];
  tasks: Task[];
  permissions: Permission[];
  handleCheckBox: (roleId: string, taskId: string) => void;
}

const RoleTable: React.FC<RoleTableProps> = ({
  roles,
  tasks,
  permissions,
  handleCheckBox,
}) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [localPermissions, setLocalPermissions] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    // Fetch modules from the API
    const fetchModules = async () => {
      try {
        const response = await getModules();
        setModules(response.data);
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    };

    fetchModules();
  }, []);

  useEffect(() => {
    const permissionMap = new Map<string, boolean>();
    permissions.forEach((perm) => {
      permissionMap.set(`${perm.roleId}_${perm.taskId}`, perm.enable);
    });
    setLocalPermissions(permissionMap);
  }, [permissions]);

  const getModuleName = (moduleId: string) => {
    const module = modules.find((mod) => mod._id === moduleId);
    return module ? module.name : 'Unknown Module';
  };

  const handleLocalCheckBox = (roleId: string, taskId: string) => {
    const key = `${roleId}_${taskId}`;
    const currentStatus = localPermissions.get(key) || false;
    const updatedStatus = !currentStatus;

    // Force the component to re-render by updating the state in a new map
    setLocalPermissions(new Map(localPermissions.set(key, updatedStatus)));
    handleCheckBox(roleId, taskId);
  };

  return (
    <Box className="role-table-container">
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="header-module">Module / Capability</TableCell>
              <TableCell className="header-task">Tasks</TableCell>
              {roles.map((role) => (
                <TableCell key={role._id} align="center">
                  {role.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task._id} className="table-row">
                <TableCell className="module-cell">{getModuleName(task.moduleId)}</TableCell>
                <TableCell className="task-cell">{task.name}</TableCell>
                {roles.map((role) => {
                  const key = `${role._id}_${task._id}`;
                  const isChecked = localPermissions.get(key) || false;

                  return (
                    <TableCell key={role._id} align="center">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => handleLocalCheckBox(role._id, task._id)}
                        color="primary"
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RoleTable;
