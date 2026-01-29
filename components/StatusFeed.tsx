import React, { useState, useEffect } from 'react';
import { UserReport } from '../types';
import { AlertTriangle, CheckCircle, ThermometerSnowflake, MapPin, Activity } from 'lucide-react';

interface StatusFeedProps {
    userLocation: { lat: number, lng: number } | null;
}

export const StatusFeed: React.FC<StatusFeedProps> = ({ userLocation }) => {
    const [reports, setReports] = useState<UserReport[]>([]);

    // Simulate real-time updates (placeholder)
    useEffect(() => {
        const interval = setInterval(() => {
            // In a real app, fetch from backend
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'OUTAGE': return <AlertTriangle className="text-danger" />;
            case 'RESTORED': return <CheckCircle className="text-success" />;
            case 'WARMING_NEEDED': return <ThermometerSnowflake className="text-primary" />;
            default: return <AlertTriangle />;
        }
    };

    return (
        <div className="flex flex-col gap-4 pb-24 px-4 pt-4">
            <h2 className="text-xl font-bold text-white mb-2">Activity</h2>
            
            {reports.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                    <Activity size={48} className="text-subtext mb-4" />
                    <p className="text-subtext text-center font-medium">No recent activity reported.</p>
                </div>
            )}

            {reports.map((report) => (
                <div key={report.id} className="bg-surface rounded-2xl p-4 flex gap-4 border border-white/5">
                    <div className="mt-1 bg-white/10 p-2 rounded-full h-fit">
                        {getIcon(report.type)}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <span className={`text-sm font-bold tracking-wide ${report.type === 'RESTORED' ? 'text-success' : report.type === 'OUTAGE' ? 'text-danger' : 'text-primary'}`}>
                                {report.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-subtext">{new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-white mt-1 text-lg leading-snug">{report.description}</p>
                        <div className="flex items-center gap-1 mt-2 text-subtext text-xs">
                            <MapPin size={12} />
                            <span>{report.address}</span>
                            {report.verified && (
                                <span className="ml-2 bg-success/20 text-success px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Verified</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            <div className="h-10"></div>
        </div>
    );
};
