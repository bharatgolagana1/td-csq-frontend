import React from 'react';
import ReactECharts from 'echarts-for-react';
import { SampleData } from '../SampleData/SampleData';
import './CategoryComparingRating.css';

const CategoryComparisonRating: React.FC = () => {
    const { categories, series } = SampleData.categoryComparisonRating;

    const option = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: series.map(s => s.name),
            bottom: 0
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: categories
        },
        yAxis: {
            type: 'value'
        },
        series: series.map(s => ({
            name: s.name,
            type: 'line',
            data: s.data,
            smooth: true,
            lineStyle: {
                width: 3
            }
        }))
    };

    return (
        <div className="category-comparison-rating">
            <div className="chart-title">Category Comparison Rating</div>
            <ReactECharts option={option} className="chart" />
        </div>
    );
};

export default CategoryComparisonRating;