// src/components/RoleMapping.tsx
import React, { useState, useEffect } from 'react';
import './RoleMapping.css'; // Import the CSS file for styling

interface Role {
  module: string;
  tasks: string[];
  permissions: { [role: string]: boolean }[];
}

const RoleMapping: React.FC = () => {
  const [rolesData, setRolesData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data from an API
    const fetchRolesData = async () => {
      // Here you would fetch data from your API
      const response = await fetch('/api/roles');
      const data = await response.json();
      setRolesData(data);
      setLoading(false);
    };

    fetchRolesData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="role-mapping-container">
      <div className="buttons">
        <button>Add New Role</button>
        <button>Add New Module</button>
        <button>Add New Task</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Module / Capability</th>
            <th>Tasks</th>
            <th>Admin</th>
            <th>Finance</th>
            <th>Records</th>
            <th>Training</th>
            <th>Instructor</th>
          </tr>
        </thead>
        <tbody>
          {rolesData.map((role, moduleIndex) => (
            <React.Fragment key={moduleIndex}>
              <tr>
                <td rowSpan={role.tasks.length}>{role.module}</td>
                <td>{role.tasks[0]}</td>
                {Object.keys(role.permissions[0]).map((key, index) => (
                  <td key={index}>
                    <input type="checkbox" checked={role.permissions[0][key]} readOnly />
                  </td>
                ))}
              </tr>
              {role.tasks.slice(1).map((task, taskIndex) => (
                <tr key={taskIndex}>
                  <td>{task}</td>
                  {Object.keys(role.permissions[taskIndex + 1]).map((key, index) => (
                    <td key={index}>
                      <input type="checkbox" checked={role.permissions[taskIndex + 1][key]} readOnly />
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoleMapping;
