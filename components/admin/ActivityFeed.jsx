import { Clock } from 'lucide-react';
import Image from 'next/image';

const ActivityFeed = ({ activities }) => {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">Last 10</span>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 p-0">
                {activities.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No recent activity</div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {activities.map((activity) => (
                            <div key={activity.id} className="p-4 hover:bg-gray-800/50 transition-colors flex gap-4">
                                <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0 text-lg">
                                    {activity.user?.image ? (
                                        <Image src={activity.user.image} alt="" className="h-10 w-10 rounded-full object-cover" width={40} height={40} />
                                    ) : (
                                        <span>{activity.user?.name?.[0] || '?'}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {activity.user?.name || 'Unknown User'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        <span className="text-indigo-400 font-medium">{activity.action}</span>
                                        {' • '}
                                        {activity.targetType}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(activity.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
