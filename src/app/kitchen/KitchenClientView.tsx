"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { updateOrderStatusAction } from "@/app/actions/orderActions";
import { useRouter } from "next/navigation";
import {
  Flame,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  RotateCw,
  ChefHat,
  AlertTriangle,
  Sparkles,
  Package,
} from "lucide-react";

interface KitchenClientViewProps {
  initialOrders: any[];
}

export default function KitchenClientView({ initialOrders }: KitchenClientViewProps) {
  const { language, dict } = useApp();
  const router = useRouter();

  const [orders, setOrders] = useState(initialOrders);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Sync state when initialOrders changes
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Clock tick & auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);

    const refreshTimer = setInterval(() => {
      router.refresh();
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(refreshTimer);
    };
  }, [router]);

  // Audio Chime utility
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  // Classify orders into 4 operational buckets based on state and release timing
  const { upcoming, readyToPrep, preparing, ready } = useMemo(() => {
    const buckets = {
      upcoming: [] as any[],
      readyToPrep: [] as any[],
      preparing: [] as any[],
      ready: [] as any[],
    };

    orders.forEach((order) => {
      const releaseTime = new Date(order.plannedPrepStartTime);
      const isReleaseTriggered = currentTime.getTime() >= releaseTime.getTime();

      if (order.status === "READY") {
        buckets.ready.push(order);
      } else if (order.status === "PREPARING") {
        buckets.preparing.push(order);
      } else if (order.status === "QUEUED" || order.status === "CONFIRMED") {
        if (isReleaseTriggered) {
          buckets.readyToPrep.push(order);
        } else {
          buckets.upcoming.push(order);
        }
      }
    });

    return buckets;
  }, [orders, currentTime]);

  const handleStatusChange = async (orderId: string, nextStatus: any) => {
    setIsUpdating(orderId);
    playChime();
    await updateOrderStatusAction(orderId, nextStatus, "مطبخ بيتزا هاوس");
    router.refresh();
    setIsUpdating(null);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-stone-950 text-white p-4 sm:p-6 space-y-6">
      {/* KDS Control Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-stone-900 p-4 rounded-3xl border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pizza-600 flex items-center justify-center text-amber-300 shadow-md">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black font-cairo flex items-center gap-2">
              <span>{dict.kitchen.title}</span>
              <span className="text-xs bg-amber-400 text-stone-950 px-2 py-0.5 rounded font-outfit font-black">
                LIVE
              </span>
            </h1>
            <p className="text-xs text-stone-400 font-outfit">
              {currentTime.toLocaleTimeString(language === "ar" ? "ar-YE" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? "bg-stone-800 border-stone-700 text-emerald-400"
                : "bg-stone-900 border-stone-800 text-stone-500"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{dict.kitchen.soundToggle}</span>
          </button>

          <button
            onClick={() => {
              router.refresh();
              playChime();
            }}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 flex items-center gap-1.5 text-xs font-bold"
          >
            <RotateCw className="w-4 h-4" />
            <span className="hidden sm:inline">{dict.kitchen.autoRefresh}</span>
          </button>
        </div>
      </div>

      {/* 4 Column Kitchen Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {/* Col 1: Upcoming Scheduled */}
        <div className="bg-stone-900/60 rounded-3xl p-4 border border-stone-800/80 space-y-4">
          <div className="flex justify-between items-center border-b border-stone-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-200 font-cairo">
                {dict.kitchen.colUpcoming}
              </h3>
              <p className="text-[11px] text-stone-500">{dict.kitchen.colUpcomingDesc}</p>
            </div>
            <span className="w-6 h-6 rounded-full bg-stone-800 text-stone-300 text-xs font-bold font-outfit flex items-center justify-center">
              {upcoming.length}
            </span>
          </div>

          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-xs text-stone-600 text-center py-8">{dict.kitchen.emptyCol}</p>
            ) : (
              upcoming.map((order) => (
                <TicketCard
                  key={order.id}
                  order={order}
                  type="upcoming"
                  language={language}
                  dict={dict}
                  isUpdating={isUpdating === order.id}
                  onAction={() => handleStatusChange(order.id, "PREPARING")}
                />
              ))
            )}
          </div>
        </div>

        {/* Col 2: Ready to Prepare (Release window active!) */}
        <div className="bg-stone-900/90 rounded-3xl p-4 border-2 border-amber-500/60 space-y-4 shadow-lg shadow-amber-950/20">
          <div className="flex justify-between items-center border-b border-stone-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-amber-400 font-cairo flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>{dict.kitchen.colReadyToPrep}</span>
              </h3>
              <p className="text-[11px] text-stone-400">{dict.kitchen.colReadyToPrepDesc}</p>
            </div>
            <span className="w-6 h-6 rounded-full bg-amber-400 text-stone-950 text-xs font-black font-outfit flex items-center justify-center animate-pulse">
              {readyToPrep.length}
            </span>
          </div>

          <div className="space-y-3">
            {readyToPrep.length === 0 ? (
              <p className="text-xs text-stone-600 text-center py-8">{dict.kitchen.emptyCol}</p>
            ) : (
              readyToPrep.map((order) => (
                <TicketCard
                  key={order.id}
                  order={order}
                  type="readyToPrep"
                  language={language}
                  dict={dict}
                  isUpdating={isUpdating === order.id}
                  onAction={() => handleStatusChange(order.id, "PREPARING")}
                />
              ))
            )}
          </div>
        </div>

        {/* Col 3: Preparing (In Oven) */}
        <div className="bg-stone-900/60 rounded-3xl p-4 border border-pizza-600/40 space-y-4">
          <div className="flex justify-between items-center border-b border-stone-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-pizza-400 font-cairo flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-pizza-500" />
                <span>{dict.kitchen.colPreparing}</span>
              </h3>
              <p className="text-[11px] text-stone-500">{dict.kitchen.colPreparingDesc}</p>
            </div>
            <span className="w-6 h-6 rounded-full bg-pizza-600 text-white text-xs font-bold font-outfit flex items-center justify-center">
              {preparing.length}
            </span>
          </div>

          <div className="space-y-3">
            {preparing.length === 0 ? (
              <p className="text-xs text-stone-600 text-center py-8">{dict.kitchen.emptyCol}</p>
            ) : (
              preparing.map((order) => (
                <TicketCard
                  key={order.id}
                  order={order}
                  type="preparing"
                  language={language}
                  dict={dict}
                  isUpdating={isUpdating === order.id}
                  onAction={() => handleStatusChange(order.id, "READY")}
                />
              ))
            )}
          </div>
        </div>

        {/* Col 4: Ready for Pickup */}
        <div className="bg-stone-900/60 rounded-3xl p-4 border border-emerald-600/40 space-y-4">
          <div className="flex justify-between items-center border-b border-stone-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-emerald-400 font-cairo flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{dict.kitchen.colReady}</span>
              </h3>
              <p className="text-[11px] text-stone-500">{dict.kitchen.colReadyDesc}</p>
            </div>
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-stone-950 text-xs font-black font-outfit flex items-center justify-center">
              {ready.length}
            </span>
          </div>

          <div className="space-y-3">
            {ready.length === 0 ? (
              <p className="text-xs text-stone-600 text-center py-8">{dict.kitchen.emptyCol}</p>
            ) : (
              ready.map((order) => (
                <TicketCard
                  key={order.id}
                  order={order}
                  type="ready"
                  language={language}
                  dict={dict}
                  isUpdating={isUpdating === order.id}
                  onAction={() => handleStatusChange(order.id, "COMPLETED")}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketCard({
  order,
  type,
  language,
  dict,
  isUpdating,
  onAction,
}: {
  order: any;
  type: "upcoming" | "readyToPrep" | "preparing" | "ready";
  language: string;
  dict: any;
  isUpdating: boolean;
  onAction: () => void;
}) {
  const pickupTimeStr = new Date(order.requestedPickupTime).toLocaleTimeString(
    language === "ar" ? "ar-YE" : "en-US",
    { hour: "2-digit", minute: "2-digit" }
  );

  const releaseTimeStr = new Date(order.plannedPrepStartTime).toLocaleTimeString(
    language === "ar" ? "ar-YE" : "en-US",
    { hour: "2-digit", minute: "2-digit" }
  );

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        type === "readyToPrep"
          ? "bg-stone-850 border-amber-500/80 shadow-md shadow-amber-950/30"
          : type === "preparing"
          ? "bg-stone-850 border-pizza-600/60"
          : type === "ready"
          ? "bg-stone-850 border-emerald-500/60"
          : "bg-stone-850 border-stone-800"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b border-stone-800 pb-2.5">
        <div>
          <span className="text-base font-black text-white font-outfit">
            {order.orderNumber}
          </span>
          <p className="text-xs text-stone-400 font-bold">{order.customerName}</p>
        </div>

        <div className="text-end">
          <span className="text-[10px] text-stone-400 block font-cairo">
            {dict.kitchen.targetPickup}
          </span>
          <span className="text-xs font-black text-amber-300 font-outfit">
            {pickupTimeStr}
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="py-3 space-y-2 text-xs">
        {order.items.map((item: any) => (
          <div key={item.id} className="space-y-0.5">
            <div className="flex items-center justify-between font-bold text-stone-100">
              <span>
                {item.quantity}x {language === "ar" ? item.productNameAr : item.productNameEn}
              </span>
            </div>

            {item.options?.length > 0 && (
              <div className="text-[11px] text-amber-400 ps-2">
                {item.options
                  .map((o: any) => (language === "ar" ? o.nameAr : o.nameEn))
                  .join(" + ")}
              </div>
            )}

            {item.itemNotes && (
              <p className="text-[10px] text-pizza-400 italic ps-2">
                &quot;{item.itemNotes}&quot;
              </p>
            )}
          </div>
        ))}

        {order.notes && (
          <div className="pt-1.5 border-t border-stone-800/80 text-[11px] text-red-400 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>ملاحظة: {order.notes}</span>
          </div>
        )}
      </div>

      {/* Footer Action Button */}
      <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
        <span className="text-[10px] text-stone-500 font-outfit">
          {order.pickupMode === "ASAP" ? "فوري (ASAP)" : `بدء: ${releaseTimeStr}`}
        </span>

        {type === "upcoming" ? (
          <button
            onClick={onAction}
            disabled={isUpdating}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition-colors"
          >
            تقديم البدء
          </button>
        ) : type === "readyToPrep" ? (
          <button
            onClick={onAction}
            disabled={isUpdating}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black rounded-xl text-xs shadow-md shadow-amber-600/30 transition-all flex items-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{dict.kitchen.startBaking}</span>
          </button>
        ) : type === "preparing" ? (
          <button
            onClick={onAction}
            disabled={isUpdating}
            className="px-4 py-2 bg-gradient-to-r from-pizza-600 to-pizza-700 hover:from-pizza-700 hover:to-pizza-800 text-white font-bold rounded-xl text-xs shadow-md shadow-pizza-700/30 transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{dict.kitchen.markReady}</span>
          </button>
        ) : (
          <button
            onClick={onAction}
            disabled={isUpdating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-700/30 transition-all flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>{dict.kitchen.markCompleted}</span>
          </button>
        )}
      </div>
    </div>
  );
}
