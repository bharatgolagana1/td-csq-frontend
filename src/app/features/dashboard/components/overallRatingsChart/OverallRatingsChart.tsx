import React from 'react';
import ReactECharts from 'echarts-for-react';
import { SampleData } from '../SampleData/SampleData';
import './OverallRatingsChart.css'
const OverallRatingsChart: React.FC = () => {
    const { labels, values } = SampleData.overallRatings;
    
    // Colors for the bars
    const colors = ['#FFEB3B', '#2196F3', '#F44336'];

    const option = {
        xAxis: {
            type: 'category',
            data: labels
        },
        yAxis: {
            type: 'value'
        },
        series: [{
            data: values.map((value, index) => ({
                value,
                itemStyle: {
                    color: colors[index % colors.length] // Cycle through the colors
                }
            })),
            type: 'bar',
            barWidth: '10%',  // Adjust the bar width to 10%
            label: {
                show: true,
                position: 'top',
                formatter: '{c}',
                backgroundColor: '#fff',
                borderRadius: 10,
                padding: 5,
                color: '#000',
                borderWidth: 1,
                borderColor: colors // Color border same as bar color
            }
        }]
    };

    return (
        <div className='overall-rating'>
            <ReactECharts option={option} />;
        </div>
    )
};

export default OverallRatingsChart;