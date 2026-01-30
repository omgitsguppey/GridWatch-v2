import React, { useState, useEffect } from 'react';
import { UserReport } from '../types';
import { AlertTriangle, CheckCircle, ThermometerSnowflake, MapPin, Activity, Loader2 } from 'lucide-react';

interface StatusFeedProps {
    userLocation: { lat: number, lng: number } | null;
}

const BACKEND_URL = 'https://gridwatch-323159573006.us-west1.run.app';

const MOCK_REPORTS: UserReport[] = [
    {
        id: 'm1',
        type: 'OUTAGE',
        timestamp: Date.now() - 120000,
        location: { lat: 36.1627, lng: -86.7816, address: 'Main St' },
        description: 'Power flicker reported near downtown. Crews checking substation.',
        verified: true
    },
    {
        id: 'm2',
        type: 'WARMING_NEEDED',
        timestamp: Date.now() - 600000,
        location: { lat: 36.1473, lng: -86.8130, address: 'Westside' },
        description: 'Requesting extra blankets at the community center.',
        verified: false
    }
];

export const StatusFeed: React.FC<StatusFeedProps> = ({ userLocation }) => {
    const [reports, setReports] = useState<UserReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [isReviewMode, setIsReviewMode] = useState(false);

    const fetchReports = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/reports`);
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            setReports(data.reports || []);
            setIsReviewMode(false);
        } catch (e) {
            setIsReviewMode(true);
            if (reports.length === 0) setReports(MOCK_REPORTS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
        const interval = setInterval(fetchReports, 15000);
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

    if (loading && reports.length === 0) {
        return <div className="flex flex-col items-center justify-center h-full opacity-40"><Loader2 size={32} className="animate-spin text-subtext" /></div>;
    }

    return (
        <div className="flex flex-col gap-4 pb-24 px-4 pt-4 animate-in fade-in duration-700">
            <div className="flex justify-between items-end mb-2">
                <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                {isReviewMode && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/30 text-primary bg-primary/5">
                        Review Mode
                    </span>
                )}
            </div>
            
            {reports.map((report) => (
                <div key={report.id} className="bg-surface rounded-2xl p-4 flex gap-4 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="mt-1 bg-white/5 p-2 rounded-full h-fit">{getIcon(report.type)}</div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-subtext">
                                {report.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-bold text-subtext/60">{new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-white mt-1 text-[16px] font-medium leading-tight">{report.description}</p>
                        <div className="flex items-center gap-1 mt-2 text-subtext text-[11px]">
                            <MapPin size={10} />
                            <span className="truncate max-w-[150px]">{report.location.address || "Nearby"}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
