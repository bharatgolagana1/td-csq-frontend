import { Card, CardActionArea, CardContent, Typography, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate('/settings/cycle');
  };
  const handleRoleClick = () =>{
    navigate('/settings/role-mapping'); 
  }
  const handleSecondClick = () => {
    alert('Second click');
  };

  const cards = [
    { title: 'Assessment Cycle', description: 'click this to start a new assessment', onClick: handleCardClick },
    { title: 'Roles-Mapping', description: 'click here to map roles ', onClick: handleRoleClick },
    { title: 'Third Card', description: 'Another card description', onClick: handleSecondClick },
    { title: 'Fourth Card', description: 'Another card description', onClick: handleSecondClick },
    { title: 'Fifth Card', description: 'Another card description', onClick: handleSecondClick },
    { title: 'Sixth Card', description: 'Another card description', onClick: handleSecondClick },
    { title: 'Seventh Card', description: 'Another card description', onClick: handleSecondClick },
    { title: 'Eighth Card', description: 'Another card description', onClick: handleSecondClick },
  ];

  return (
    <Grid container spacing={3} justifyContent="center">
      {cards.map((card, index) => (
        <Grid item key={index} xs={12} sm={6} md={4} lg={3}>
          <Card onClick={card.onClick} style={{ margin: '15px' }}>
            <CardActionArea>
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default Settings;
