import { DollarSign, Users, Package, Activity } from 'lucide-react';

const DashboardStats = ({ stats }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const cardData = [
        { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Active Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Active Subscriptions', value: stats.activeSubscriptions.toLocaleString(), icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Total Products', value: stats.totalProducts.toLocaleString(), icon: Package, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cardData.map((stat, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex items-center justify-between hover:border-gray-700 transition-colors">
                    <div>
                        <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                        <stat.icon className={stat.color} size={24} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardStats;
