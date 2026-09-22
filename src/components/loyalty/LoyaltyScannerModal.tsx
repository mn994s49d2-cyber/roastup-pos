import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  QrCode, 
  Camera, 
  Barcode, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Award, 
  Gift, 
  User, 
  ArrowRight, 
  RefreshCw,
  Zap,
  Tag
} from 'lucide-react';
import { LoyaltyMember, LoyaltyTransactionInfo, LoyaltyVoucher, LoyaltyReward } from '../../types';
import { sound } from '../../utils/sound';

interface LoyaltyScannerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onApplyLoyalty: (loyaltyInfo: LoyaltyTransactionInfo) => void;
  currentMember?: LoyaltyTransactionInfo | null;
}

export const LoyaltyScannerModal: React.FC<LoyaltyScannerModalProps> = ({
  isOpen = true,
  onClose,
  onApplyLoyalty,
  currentMember
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'hardware'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [processingCode, setProcessingCode] = useState(false);

  // Scanned result states
  const [lookupResult, setLookupResult] = useState<{
    type: 'member' | 'voucher';
    member?: LoyaltyMember;
    voucher?: LoyaltyVoucher;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'roastup-qr-reader-container';
  const hardwareInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setLookupResult(null);
      setManualCode('');
      setScannerError(null);
      return;
    }

    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
      setTimeout(() => hardwareInputRef.current?.focus(), 150);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setScannerError(null);
    setCameraLoading(true);

    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {}
      }

      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleScannedText(decodedText);
        },
        () => {
          // Frame scan error (ignore standard frame misses)
        }
      );

      setCameraStarted(true);
      setCameraLoading(false);
    } catch (err: any) {
      console.warn('Camera initiation failed:', err);
      setCameraLoading(false);
      setCameraStarted(false);
      setScannerError(
        err?.message?.includes('Permission')
          ? 'Camera permission denied. Please allow camera access or use the Hardware Scanner tab.'
          : 'Could not access webcam. You can use the Hardware 2D Scanner or manual code entry.'
      );
      // Fallback tab
      setActiveTab('hardware');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
      scannerRef.current = null;
    }
    setCameraStarted(false);
    setCameraLoading(false);
  };

  const handleScannedText = async (text: string) => {
    if (processingCode) return;
    setProcessingCode(true);
    sound.playRegisterDing();

    // Pause camera scanning temporarily if running
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.pause();
      } catch {}
    }

    try {
      const res = await fetch('/api/pos/scan-loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: text.trim(), action: 'lookup' })
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setScannerError(null);
        if (data.type === 'voucher' && data.voucher) {
          setLookupResult({
            type: 'voucher',
            voucher: data.voucher,
            member: data.member
          });
        } else if (data.type === 'member' && data.member) {
          setLookupResult({
            type: 'member',
            member: data.member
          });
        }
      } else {
        sound.playError();
        setScannerError(data.error || 'Invalid or unrecognized Roastup Loyalty QR code');
        // Resume camera
        if (scannerRef.current) {
          try {
            await scannerRef.current.resume();
          } catch {}
        }
      }
    } catch (err: any) {
      sound.playError();
      setScannerError('Network error verifying loyalty code. Please retry.');
    } finally {
      setProcessingCode(false);
    }
  };

  const handleHardwareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScannedText(manualCode.trim());
  };

  const handleApplyMemberOnly = () => {
    if (!lookupResult?.member) return;
    sound.playSuccess();
    onApplyLoyalty({
      memberId: lookupResult.member.id,
      memberName: lookupResult.member.name,
      previousPoints: lookupResult.member.points,
      newPoints: lookupResult.member.points
    });
    onClose();
  };

  const handleApplyVoucher = () => {
    if (!lookupResult?.voucher) return;
    sound.playSuccess();
    onApplyLoyalty({
      memberId: lookupResult.voucher.memberId,
      memberName: lookupResult.member?.name || lookupResult.voucher.memberId,
      rewardId: lookupResult.voucher.rewardId,
      rewardTitle: lookupResult.voucher.title,
      pointsCost: lookupResult.voucher.pointsCost,
      discountValue: lookupResult.voucher.discountValue,
      previousPoints: lookupResult.member?.points,
      qrPayload: manualCode || lookupResult.voucher.title
    });
    onClose();
  };

  const handleRedeemMemberReward = (reward: LoyaltyReward) => {
    if (!lookupResult?.member) return;
    sound.playSuccess();
    onApplyLoyalty({
      memberId: lookupResult.member.id,
      memberName: lookupResult.member.name,
      rewardId: reward.id,
      rewardTitle: reward.title,
      pointsCost: reward.pointsCost,
      discountValue: reward.discountValue,
      previousPoints: lookupResult.member.points,
      newPoints: Math.max(0, lookupResult.member.points - reward.pointsCost)
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-stone-900 dark:text-white flex items-center gap-2">
                Scan Roastup Loyalty QR
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
                  Club Rewards
                </span>
              </h3>
              <p className="text-xs text-stone-500">Scan customer phone QR or type barcode to redeem rewards</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-4 flex gap-2 border-b border-stone-100 dark:border-stone-800 pb-3 bg-white dark:bg-stone-900">
          <button
            onClick={() => {
              setLookupResult(null);
              setActiveTab('camera');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera / Tablet (Option A)</span>
          </button>

          <button
            onClick={() => {
              setLookupResult(null);
              setActiveTab('hardware');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'hardware'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>2D Scanner Gun (Option B)</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Lookup Result View (if already recognized) */}
          {lookupResult ? (
            <div className="space-y-4">
              {lookupResult.type === 'voucher' && lookupResult.voucher && (
                <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                    <Gift className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-black uppercase tracking-wider">Valid Reward Voucher Detected</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-stone-900 dark:text-white">
                        {lookupResult.voucher.title}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                        Member: <strong className="font-mono text-stone-900 dark:text-white">{lookupResult.voucher.memberId}</strong>
                        {lookupResult.member && ` (${lookupResult.member.name})`}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        -£{lookupResult.voucher.discountValue.toFixed(2)}
                      </span>
                      <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                        Cost: {lookupResult.voucher.pointsCost} pts
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={handleApplyVoucher}
                      className="flex-1 py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Apply £{lookupResult.voucher.discountValue.toFixed(2)} Discount to Order</span>
                    </button>
                    <button
                      onClick={() => setLookupResult(null)}
                      className="py-3 px-3 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold cursor-pointer"
                    >
                      Rescan
                    </button>
                  </div>
                </div>
              )}

              {lookupResult.type === 'member' && lookupResult.member && (
                <div className="p-4 rounded-3xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-stone-900 text-amber-400 dark:bg-white dark:text-stone-900 flex items-center justify-center font-black">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-stone-900 dark:text-white">
                            {lookupResult.member.name}
                          </h4>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-stone-950">
                            {lookupResult.member.tier || 'Member'}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-stone-500">{lookupResult.member.id}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                        {lookupResult.member.points}
                      </span>
                      <span className="block text-[10px] font-black uppercase text-stone-400">Points Balance</span>
                    </div>
                  </div>

                  {/* Available rewards */}
                  {lookupResult.member.availableRewards && lookupResult.member.availableRewards.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-700">
                      <span className="text-[11px] font-black uppercase tracking-wider text-stone-500 block">
                        Eligible Rewards to Redeem Today:
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {lookupResult.member.availableRewards.map(reward => {
                          const canAfford = (lookupResult.member?.points || 0) >= reward.pointsCost;
                          return (
                            <div
                              key={reward.id}
                              className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                                canAfford
                                  ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                                  : 'bg-stone-100 dark:bg-stone-800/40 border-stone-200/50 opacity-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <div>
                                  <span className="font-black text-stone-900 dark:text-white block">{reward.title}</span>
                                  <span className="text-[10px] text-stone-500">Saves £{reward.discountValue.toFixed(2)} • {reward.pointsCost} pts</span>
                                </div>
                              </div>

                              {canAfford ? (
                                <button
                                  onClick={() => handleRedeemMemberReward(reward)}
                                  className="py-1 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-[11px] cursor-pointer shadow-xs"
                                >
                                  Redeem (-{reward.pointsCost}p)
                                </button>
                              ) : (
                                <span className="text-[10px] text-stone-400 font-bold">Need {reward.pointsCost - (lookupResult.member?.points || 0)} more</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={handleApplyMemberOnly}
                      className="flex-1 py-3 px-4 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Attach Member to Order (Earn Points)</span>
                    </button>
                    <button
                      onClick={() => setLookupResult(null)}
                      className="py-3 px-3 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold cursor-pointer"
                    >
                      Rescan
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Option A: Camera Mode */}
              {activeTab === 'camera' && (
                <div className="space-y-3">
                  <div className="relative rounded-3xl overflow-hidden bg-black aspect-square flex items-center justify-center border-2 border-stone-800">
                    <div id={readerElementId} className="w-full h-full" />

                    {cameraLoading && (
                      <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center text-white space-y-2">
                        <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                        <span className="text-xs font-bold">Starting camera viewfinder...</span>
                      </div>
                    )}

                    {/* Viewfinder Target Overlays */}
                    {!cameraLoading && cameraStarted && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-56 h-56 border-2 border-amber-400 rounded-2xl relative shadow-lg">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1" />
                          <div className="w-full h-0.5 bg-amber-400/80 absolute top-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-center text-xs text-stone-500">
                    Hold customer's phone QR code in front of the lens. It will scan automatically.
                  </p>
                </div>
              )}

              {/* Option B: Hardware 2D Barcode Scanner / Key-in Mode */}
              {activeTab === 'hardware' && (
                <div className="space-y-4">
                  <form onSubmit={handleHardwareSubmit} className="space-y-3">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                      Hardware 2D Barcode Scanner / Code Entry:
                    </label>
                    <div className="relative">
                      <Barcode className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        ref={hardwareInputRef}
                        type="text"
                        value={manualCode}
                        onChange={e => setManualCode(e.target.value)}
                        placeholder="Scan or paste ROASTUP:MEMBER:... or ROASTUP:VOUCHER:..."
                        className="w-full pl-11 pr-24 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-2xl text-xs font-mono text-stone-900 dark:text-white focus:border-amber-400 outline-hidden transition-colors"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!manualCode.trim() || processingCode}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {processingCode ? 'Checking...' : 'Parse Code'}
                      </button>
                    </div>
                  </form>

                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-400 space-y-2">
                    <span className="font-bold block text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Instant Simulator Test QRs:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleScannedText('ROASTUP:MEMBER:RP-88392')}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[11px] font-bold text-stone-800 dark:text-stone-200 hover:border-amber-400 cursor-pointer"
                      >
                        Member: Sarah M. (RP-88392)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScannedText('ROASTUP:VOUCHER:RP-88392:reward-dip:50:Free%20Signature%20Dip:1.25')}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-[11px] font-bold text-amber-900 dark:text-amber-300 hover:border-amber-500 cursor-pointer"
                      >
                        Voucher: Free Dip (-£1.25)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScannedText('ROASTUP:VOUCHER:RP-88392:reward-spuds:150:50%25%20Off%20Spuds%20Portion:3.75')}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-[11px] font-bold text-amber-900 dark:text-amber-300 hover:border-amber-500 cursor-pointer"
                      >
                        Voucher: 50% Off Spuds (-£3.75)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error messages */}
              {scannerError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scannerError}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 flex items-center justify-between text-xs">
          <span className="text-stone-400 text-[11px]">
            Formats: ROASTUP:MEMBER:id • ROASTUP:VOUCHER:id:reward:cost:title:discount
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-white font-bold cursor-pointer hover:bg-stone-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
