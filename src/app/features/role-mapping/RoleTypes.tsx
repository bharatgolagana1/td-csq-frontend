
export interface Role {
    _id: any;
    id: string;
    name: string;
  }
  
  export interface Module {
    _id: string;
    id: string;
    name: string;
    value: string;
  }
  
  export interface Task {
    _id: string;
    name: string;
    task_value: string;
    moduleId: string;
  }
  
  export interface Permission {
    roleId: string;
    taskId: string;
    enable: boolean;
  }
  