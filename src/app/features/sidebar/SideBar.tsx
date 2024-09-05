import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Link } from 'react-router-dom';
import './Sidebar.css';

import dashboard from '../../../assets/dashboard.svg';
import customerSampling from '../../../assets/customerSampling.svg';
import assessment from '../../../assets/assessment.svg';
import history from '../../../assets/history.svg';
import assessmentHistory from '../../../assets/assessmentHistory.svg';
import user from '../../../assets/user.svg';
import airport from '../../../assets/airport.svg';
import settings from '../../../assets/csqIcon.png';
import roles from '../../../assets/user.svg';

const Sidebar: React.FC = () => {
  const [activeItem, setActiveItem] = useState<string>('Assessment');
  const [historyExpanded, setHistoryExpanded] = useState<boolean>(false);

  const handleListItemClick = (item: string) => {
    setActiveItem(item);
    if (item === 'History') {
      setHistoryExpanded(!historyExpanded);
    }
  };

  return (
    <div className="sidebar_main">
      <Drawer
        variant="permanent"
        className="drawer"
        classes={{ paper: 'drawer-paper' }}
      >
        <Box className="sidebar_box">
          <List className="list-items">
            <ListItem
              className={`list-item ${activeItem === 'Dashboard' ? 'active' : ''}`}
              component={Link} 
              to="/dashboard" 
              onClick={() => handleListItemClick('Dashboard')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={dashboard} alt="Dashboard" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="Dashboard" className="hide-on-small" />
            </ListItem>
            <ListItem
              className={`list-item ${activeItem === 'Assessment' ? 'active' : ''}`}
              component={Link} 
              to="/assessment"
              onClick={() => handleListItemClick('Assessment')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={assessment} alt="Assessment" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="Assessment" className="hide-on-small"/>
            </ListItem>
            <ListItem
              className={`list-item ${activeItem === 'Customer Sampling' ? 'active' : ''}`}
              component={Link}
              to="/customer-sampling" 
              onClick={() => handleListItemClick('Customer Sampling')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={customerSampling} alt="Customer Sampling" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="Customer Sampling" className="hide-on-small" />
            </ListItem>
            <ListItemButton
              className={`list-item ${activeItem === 'History' ? 'active' : ''}`}
              onClick={() => handleListItemClick('History')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={history} alt="History" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="History" className="hide-on-small" />
              {historyExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={historyExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  className={`list-item ${activeItem === 'Assessment History' ? 'active' : ''}`}
                  component={Link} 
                  to="/assessment-history" 
                  onClick={() => handleListItemClick('Assessment History')}
                >
                  <ListItemIcon className="list-item-icon">
                    <img src={assessmentHistory} alt="Assessment History" style={{ width: 24, height: 24 }} />
                  </ListItemIcon>
                  <ListItemText primary="Assessment History" className="hide-on-small" />
                </ListItemButton>
              </List>
            </Collapse>
            <ListItem
              className={`list-item ${activeItem === 'Assessment Cycle' ? 'active' : ''}`}
              component={Link}
              to="/assessment-cycle"
              onClick={() => handleListItemClick('Assessment Cycle')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={user} alt="Assessment Cycle" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="Assessment Cycle" className="hide-on-small" />
            </ListItem>
            <ListItem
              className={`list-item ${activeItem === 'Parameter' ? 'active' : ''}`}
              component={Link}
              to="/parameter"
              onClick={() => handleListItemClick('Parameter')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={assessment} alt="Parameter" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="Parameter" className="hide-on-small" />
            </ListItem>
            <ListItem
              className={`list-item ${activeItem === 'CTO Activation' ? 'active' : ''}`}
              component={Link}
              to="/cto-activation"
              onClick={() => handleListItemClick('CTO Activation')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={airport} alt="CTO Activation" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="CTO Activation" className="hide-on-small" />
            </ListItem>
            <ListItem
              className={`list-item ${activeItem === 'Airport' ? 'active' : ''}`}
              component={Link}
              to="/airport"
              onClick={() => handleListItemClick('Airport')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={airport} alt="Airport" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="Airport" className="hide-on-small" />
            </ListItem>
            <ListItem
              className={`list-item ${activeItem === 'Settings' ? 'active' : ''}`}
              component={Link}
              to="/settings"
              onClick={() => handleListItemClick('Settings')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={settings} alt="Settings" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="Settings" className="hide-on-small" />
            </ListItem>
            <ListItem
              className={`list-item ${activeItem === 'Roles' ? 'active' : ''}`}
              component={Link}
              to="/role-mapping"
              onClick={() => handleListItemClick('Roles')}
            >
              <ListItemIcon className="list-item-icon">
                <img src={roles} alt="Roles" style={{ width: 24, height: 24 }} />
              </ListItemIcon>
              <ListItemText primary="Roles" className="hide-on-small" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </div>
  );
};

export default Sidebar;
