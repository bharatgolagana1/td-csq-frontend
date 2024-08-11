import React from 'react';
import ReactECharts from 'echarts-for-react';
import { SampleData } from '../SampleData/SampleData';
import './FeedbackOverview.css';

const FeedbackOverview: React.FC = () => {
    const { categories, values } = SampleData.feedbackOverview;
    const totalFeedbacks = values.reduce((a, b) => a + b, 0);

    const option = {
        tooltip: {
            trigger: 'item'
        },
        legend: {
            show: false, // Hiding the default legend
        },
        series: [
            {
                name: 'Feedback',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    formatter: '{b}\n{c}',
                    position: 'outside',
                    alignTo: 'labelLine',
                    bleedMargin: 5,
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: '14',
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: true,
                    length: 15,
                    length2: 10
                },
                data: categories.map((category, index) => ({
                    value: values[index],
                    name: category
                }))
            }
        ]
    };

    return (
        <div className="feedback-overview">
            <div className="feedback-title">Feedback Overview</div>
            <ReactECharts option={option} className="chart" />
            <div className="feedback-center">
                <span>{totalFeedbacks}</span>
                <br />
                <span>Feedbacks</span>
            </div>
        </div>
    );
};

export default FeedbackOverview;
