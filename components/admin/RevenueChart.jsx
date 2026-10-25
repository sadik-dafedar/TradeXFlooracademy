'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ data }) => {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Revenue Trend</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="date"
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickFormatter={(val) => {
                                const date = new Date(val + '-01'); // Append day to make valid date
                                return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                            }}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickFormatter={(val) => `₹${val / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#9CA3AF' }}
                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            dot={{ fill: '#8B5CF6', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;
