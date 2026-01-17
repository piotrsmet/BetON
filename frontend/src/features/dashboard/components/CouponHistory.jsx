import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';

export const CouponHistory = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const data = await apiClient.getUserCoupons();
                setCoupons(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCoupons();
    }, []);

    if (loading) return <div className="text-white text-center p-10">Ładowanie kuponów...</div>;

    if (coupons.length === 0) {
        return (
            <div className="text-center p-10 text-white/60">
                <div className="text-6xl mb-4">📜</div>
                <h3 className="text-xl font-bold">Brak kuponów</h3>
                <p>Postaw swój pierwszy zakład!</p>
            </div>
        );
    }

    return (
        <div className="py-4 space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6">Moje Kupony</h3>
            {coupons.map(coupon => (
                <div key={coupon.id} className="bg-secondary/50 backdrop-blur-sm rounded-2xl p-6 border border-accent/10 hover:border-accent/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-sm text-light/60 mb-1">
                                {new Date(coupon.data_utworzenia).toLocaleString()}
                            </div>
                            <div className="font-bold text-white text-lg">
                                Stawka: {parseFloat(coupon.stawka).toFixed(2)} PLN
                            </div>
                        </div>
                        <div className="text-right">
                             <div className={`font-bold px-3 py-1 rounded-full text-xs md:text-sm inline-block mb-2
                                ${coupon.status === 'WYGRANY' ? 'bg-emerald-500/20 text-emerald-400' : 
                                  coupon.status === 'PRZEGRANY' ? 'bg-red-500/20 text-red-400' : 
                                  'bg-blue/50 text-blue-200'}`}>
                                {coupon.status}
                             </div>
                             <div className="text-sm text-light/60">
                                Kurs: <span className="text-white font-bold">{coupon.kurs_calkowity}</span>
                             </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2 mb-4 bg-dark/20 p-3 rounded-xl">
                        {coupon.pozycje.map(pos => (
                            <div key={pos.id} className="flex justify-between items-center text-sm border-b border-white/5 last:border-0 py-2 first:pt-0 last:pb-0">
                                <span className="text-white/80">{pos.nazwa_gospodarza} - {pos.nazwa_goscia}</span>
                                <div className="flex gap-4 items-center">
                                    <span className="text-accent font-bold px-2 py-0.5 bg-accent/10 rounded">{pos.typ}</span>
                                    <span className="text-white/60 font-mono">@{pos.kurs_w_momencie}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-light/60 text-sm">Potencjalna wygrana:</span>
                        <span className={`text-xl md:text-2xl font-black ${coupon.status === 'WYGRANY' ? 'text-emerald-400' : 'text-white'}`}>
                            {coupon.potencjalna_wygrana} PLN
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};
