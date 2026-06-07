import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';

const CashoutControl = ({ coupon, onCashedOut }) => {
    const [info, setInfo] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [confirming, setConfirming] = useState(false);

    const fetchCashout = async () => {
        try {
            const data = await apiClient.getCashoutValue(coupon.id);
            setInfo(data);
        } catch (_) {}
    };

    useEffect(() => {
        fetchCashout();
        const t = setInterval(fetchCashout, 5000);
        return () => clearInterval(t);
    }, [coupon.id]);

    const handleCashout = async () => {
        if (!info?.available) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await apiClient.cashoutCoupon(coupon.id);
            onCashedOut?.(res.value);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
            setConfirming(false);
        }
    };

    if (!info) return null;
    const stake = Number(coupon.stawka);
    const potential = Number(coupon.potencjalna_wygrana);
    const pctOfPotential = potential > 0 ? Math.min(100, Math.round((info.value / potential) * 100)) : 0;
    const profit = info.value - stake;

    if (!info.available) {
        return (
            <div className="mt-3 rounded-xl px-4 py-3 bg-dark/40 border border-surface/20 flex items-center gap-3 text-sm">
                <span className="text-muted text-lg">🚫</span>
                <div>
                    <div className="font-bold text-light/70">Cashout niedostępny</div>
                    <div className="text-xs text-muted">{info.reason || 'Spróbuj później'}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-3 rounded-xl overflow-hidden border border-win/30 bg-gradient-to-br from-win/10 via-secondary/40 to-dark/40">
            <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-[0.2em] text-win font-black">Cashout</span>
                        <span className="text-[10px] text-win/60 bg-win/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-win rounded-full animate-pulse" />
                            LIVE
                        </span>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl md:text-3xl font-black text-win leading-none">
                            {info.value.toFixed(2)} <span className="text-base text-win/70">PLN</span>
                        </div>
                        <div className="text-[11px] text-muted mt-1">
                            {pctOfPotential}% potencjalnej wygranej
                        </div>
                    </div>
                </div>

                {/* Pasek progresu */}
                <div className="h-1.5 bg-dark/60 rounded-full overflow-hidden mb-3">
                    <div
                        className="h-full bg-gradient-to-r from-win to-accent transition-all duration-500"
                        style={{ width: `${pctOfPotential}%` }}
                    />
                </div>

                {/* Statystyki */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                    <div className="bg-dark/40 rounded-lg p-2">
                        <div className="text-muted text-[10px] uppercase tracking-wider">Stawka</div>
                        <div className="text-white font-bold">{stake.toFixed(2)}</div>
                    </div>
                    <div className="bg-dark/40 rounded-lg p-2">
                        <div className="text-muted text-[10px] uppercase tracking-wider">Zysk</div>
                        <div className={`font-bold ${profit >= 0 ? 'text-win' : 'text-lose'}`}>
                            {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-dark/40 rounded-lg p-2">
                        <div className="text-muted text-[10px] uppercase tracking-wider">Max</div>
                        <div className="text-light/70 font-bold">{potential.toFixed(2)}</div>
                    </div>
                </div>

                {/* Przyciski */}
                {!confirming ? (
                    <button
                        onClick={() => setConfirming(true)}
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-win to-accent text-dark font-black py-3 rounded-xl shadow-lg hover:shadow-win/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span>💰</span>
                        <span>Wypłać {info.value.toFixed(2)} PLN</span>
                    </button>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setConfirming(false)}
                            disabled={submitting}
                            className="bg-surface/50 hover:bg-surface text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                            Anuluj
                        </button>
                        <button
                            onClick={handleCashout}
                            disabled={submitting}
                            className="bg-gradient-to-r from-win to-accent text-dark font-black py-3 rounded-xl shadow hover:shadow-win/30 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Wypłacam…' : 'Potwierdź'}
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mt-2 text-xs text-lose bg-lose/10 border border-lose/20 rounded-lg p-2">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export const CouponHistory = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetchCoupons();
    }, []);

    if (loading) return <div className="text-light text-center p-10">Ładowanie kuponów...</div>;

    if (coupons.length === 0) {
        return (
            <div className="text-center p-10 text-muted">
                <div className="text-6xl mb-4">🎫</div>
                <h3 className="text-xl font-bold text-light">Brak kuponów</h3>
                <p>Postaw swój pierwszy zakład!</p>
            </div>
        );
    }

    return (
        <div className="py-4 space-y-4">
            <h3 className="text-2xl font-bold text-white mb-6">Moje Kupony</h3>
            {coupons.map(coupon => (
                <div key={coupon.id} className="bg-secondary/50 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-surface/30 hover:border-accent/20 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-sm text-muted mb-1">
                                {new Date(coupon.data_utworzenia).toLocaleString()}
                            </div>
                            <div className="font-bold text-white text-lg">
                                Stawka: {parseFloat(coupon.stawka).toFixed(2)} PLN
                            </div>
                        </div>
                        <div className="text-right">
                             <div className={`font-bold px-3 py-1 rounded-full text-xs md:text-sm inline-block mb-2
                                ${coupon.status === 'WYGRANY' ? 'bg-win/15 text-win' :
                                  coupon.status === 'PRZEGRANY' ? 'bg-lose/15 text-lose' :
                                  'bg-info/15 text-info'}`}>
                                {coupon.status}
                             </div>
                             <div className="text-sm text-muted">
                                Kurs: <span className="text-white font-bold">{coupon.kurs_calkowity}</span>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4 bg-dark/30 p-3 rounded-xl">
                        {coupon.pozycje.map(pos => (
                            <div key={pos.id} className="flex justify-between items-center text-sm border-b border-surface/15 last:border-0 py-2 first:pt-0 last:pb-0">
                                <span className="text-light/80">{pos.nazwa_gospodarza} - {pos.nazwa_goscia}</span>
                                <div className="flex gap-4 items-center">
                                    <span className="text-accent font-bold px-2 py-0.5 bg-accent/10 rounded">{pos.typ}</span>
                                    <span className="text-muted font-mono">@{pos.kurs_w_momencie}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <span className="text-muted text-sm">Potencjalna wygrana:</span>
                        <span className={`text-xl md:text-2xl font-black ${coupon.status === 'WYGRANY' ? 'text-win' : 'text-white'}`}>
                            {coupon.potencjalna_wygrana} PLN
                        </span>
                    </div>

                    {coupon.status === 'OCZEKUJACY' && (
                        <CashoutControl coupon={coupon} onCashedOut={fetchCoupons} />
                    )}
                </div>
            ))}
        </div>
    );
};
