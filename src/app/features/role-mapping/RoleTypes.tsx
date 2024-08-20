
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
    id: string;
    name: string;
    value: string;
    moduleId: string;
  }
  
  export interface Permission {
    id: string;
    roleId: string;
    taskId: string;
    enable: boolean;
  }
  