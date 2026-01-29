import React, { useState, useEffect } from 'react';
import { UserReport } from '../types';
import { AlertTriangle, CheckCircle, ThermometerSnowflake, MapPin } from 'lucide-react';

const MOCK_REPORTS: UserReport[] = [
    { id: '1', type: 'OUTAGE', timestamp: Date.now() - 1000 * 60 * 5, location: { lat: 0, lng: 0, address: '12th Ave S' }, verified: true, description: "Whole block is dark." },
    { id: '2', type: 'RESTORED', timestamp: Date.now() - 1000 * 60 * 15, location: { lat: 0, lng: 0, address: 'Belmont Blvd' }, verified: true, description: "Power just came back on!" },
    { id: '3', type: 'WARMING_NEEDED', timestamp: Date.now() - 1000 * 60 * 45, location: { lat: 0, lng: 0, address: 'Edgehill' }, verified: false, description: "Elderly couple needs heat." },
];

interface StatusFeedProps {
    userLocation: { lat: number, lng: number } | null;
}

export const StatusFeed: React.FC<StatusFeedProps> = ({ userLocation }) => {
    const [reports, setReports] = useState<UserReport[]>(MOCK_REPORTS);

    // Simulate real-time updates
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
            <h2 className="text-xl font-bold text-white mb-2">Neighborhood Pulse</h2>
            
            {/* Discrepancy Alert - Logic: If many user reports conflict with official status */}
            <div className="bg-surface border border-danger/30 rounded-xl p-4 shadow-lg shadow-danger/10">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-danger w-6 h-6 shrink-0" />
                    <div>
                        <h3 className="font-semibold text-danger">Status Conflict Detected</h3>
                        <p className="text-sm text-subtext mt-1">
                            NES Map shows "Restored" on 12th Ave S, but 14 verified user reports indicate power is still out. We are flagging this to authorities.
                        </p>
                    </div>
                </div>
            </div>

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
