"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  verifyPaymentAction,
  updateOrderStatusAction,
  togglePauseOrderingAction,
  toggleProductAvailabilityAction,
} from "@/app/actions/orderActions";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  ShoppingBag,
  CreditCard,
  ChefHat,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface AdminClientViewProps {
  restaurant: any;
  orders: any[];
  products: any[];
}

export default function AdminClientView({
  restaurant,
  orders,
  products,
}: AdminClientViewProps) {
  const { language, dict } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "payments" | "menu" | "settings"
  >("overview");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [isPaused, setIsPaused] = useState(
    restaurant?.isOnlineOrderingPaused || false
  );
  const [pauseMessage, setPauseMessage] = useState(
    restaurant?.pauseMessageAr || ""
  );

  // Metrics calculation
  const totalRevenue = orders
    .filter((o) => o.status !== "CANCELLED" && o.status !== "REJECTED")
    .reduce((acc, o) => acc + o.total, 0);

  const pendingPayments = orders.filter(
    (o) => o.payment?.status === "PENDING_VERIFICATION"
  );

  const activeKitchenCount = orders.filter((o) =>
    ["QUEUED", "PREPARING", "READY"].includes(o.status)
  ).length;

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q)
    );
  });

  const handleVerifyPayment = async (
    orderId: string,
    isApproved: boolean,
    reason?: string
  ) => {
    setIsProcessing(true);
    await verifyPaymentAction(orderId, isApproved, reason);
    setSelectedReceiptOrder(null);
    setRejectReason("");
    router.refresh();
    setIsProcessing(false);
  };

  const handleTogglePause = async () => {
    setIsProcessing(true);
    const nextState = !isPaused;
    setIsPaused(nextState);
    await togglePauseOrderingAction(nextState, pauseMessage);
    router.refresh();
    setIsProcessing(false);
  };

  const handleToggleAvailability = async (
    productId: string,
    current: boolean
  ) => {
    await toggleProductAvailabilityAction(productId, !current);
    router.refresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs text-pizza-600 dark:text-pizza-400 font-bold uppercase tracking-wider font-outfit">
            Pizza House Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white font-cairo">
            {dict.admin.title}
          </h1>
        </div>

        <button
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors w-fit"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "overview", label: dict.admin.overview, icon: TrendingUp },
          { id: "orders", label: dict.admin.orders, icon: ShoppingBag, count: orders.length },
          {
            id: "payments",
            label: dict.admin.payments,
            icon: CreditCard,
            count: pendingPayments.length,
            highlight: pendingPayments.length > 0,
          },
          { id: "menu", label: dict.admin.menuMgmt, icon: ChefHat },
          { id: "settings", label: dict.admin.settings, icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${
                isActive
                  ? "bg-pizza-700 text-white shadow-md shadow-pizza-700/20"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full font-outfit ${
                    tab.highlight
                      ? "bg-amber-400 text-stone-950 font-black animate-pulse"
                      : isActive
                      ? "bg-white/20 text-white"
                      : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview Dashboard */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-stone-400">
                <span className="text-xs font-bold font-cairo">{dict.admin.todayOrders}</span>
                <ShoppingBag className="w-5 h-5 text-pizza-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-outfit text-stone-900 dark:text-white">
                {orders.length}
              </div>
              <p className="text-[11px] text-stone-500">إجمالي الطلبات المسجلة اليوم</p>
            </div>

            <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-stone-400">
                <span className="text-xs font-bold font-cairo">{dict.admin.todayRevenue}</span>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-outfit text-emerald-600">
                {totalRevenue.toLocaleString()}{" "}
                <span className="text-xs font-normal font-cairo text-stone-500">
                  {dict.menu.currency}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">صافي المبيعات المحققة</p>
            </div>

            <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-stone-400">
                <span className="text-xs font-bold font-cairo">
                  {dict.admin.pendingVerification}
                </span>
                <CreditCard className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-outfit text-amber-600">
                {pendingPayments.length}
              </div>
              <p className="text-[11px] text-stone-500">تحويلات مالية بانتظار الاعتماد</p>
            </div>

            <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-stone-400">
                <span className="text-xs font-bold font-cairo">
                  {dict.admin.activeInKitchen}
                </span>
                <ChefHat className="w-5 h-5 text-pizza-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-outfit text-pizza-600">
                {activeKitchenCount}
              </div>
              <p className="text-[11px] text-stone-500">طلبات في مراحل الخبز والاستلام</p>
            </div>
          </div>

          {/* Quick Recent Orders Table */}
          <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-stone-900 dark:text-white font-cairo">
                أحدث الطلبات الواردة
              </h3>
              <button
                onClick={() => setActiveTab("orders")}
                className="text-xs font-bold text-pizza-700 hover:text-pizza-800"
              >
                عرض كل الطلبات ({orders.length})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="border-b border-stone-200 dark:border-stone-800 text-stone-400 uppercase font-outfit">
                  <tr>
                    <th className="py-2.5 px-3 text-start">رقم الطلب</th>
                    <th className="py-2.5 px-3 text-start">العميل</th>
                    <th className="py-2.5 px-3 text-start">وقت الاستلام</th>
                    <th className="py-2.5 px-3 text-start">الإجمالي</th>
                    <th className="py-2.5 px-3 text-start">طريقة الدفع</th>
                    <th className="py-2.5 px-3 text-start">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="py-3 px-3 font-bold font-outfit text-stone-900 dark:text-white">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 px-3 text-stone-700 dark:text-stone-300">
                        <div>{o.customerName}</div>
                        <div className="text-[10px] text-stone-400 font-outfit">
                          {o.customerPhone}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-outfit text-stone-600 dark:text-stone-400">
                        {new Date(o.requestedPickupTime).toLocaleTimeString(
                          language === "ar" ? "ar-YE" : "en-US",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold font-outfit text-stone-900 dark:text-white">
                        {o.total.toLocaleString()} {dict.menu.currency}
                      </td>
                      <td className="py-3 px-3 text-stone-600 dark:text-stone-400">
                        {o.payment?.method === "PAY_AT_PICKUP"
                          ? "الدفع عند الاستلام"
                          : "تحويل إلكتروني"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            o.status === "READY"
                              ? "bg-emerald-100 text-emerald-800"
                              : o.status === "PREPARING"
                              ? "bg-amber-100 text-amber-800"
                              : o.status === "PAYMENT_PENDING"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Orders Manager */}
      {activeTab === "orders" && (
        <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-stone-400 absolute top-3 start-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={dict.admin.searchOrders}
                className="w-full text-xs ps-9 pe-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:border-pizza-600"
              />
            </div>
            <span className="text-xs text-stone-500">
              إجمالي النتائج: {filteredOrders.length}
            </span>
          </div>

          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black font-outfit text-stone-900 dark:text-white">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-stone-400 font-bold">•</span>
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      {order.customerName} ({order.customerPhone})
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === "READY"
                          ? "bg-emerald-100 text-emerald-800"
                          : order.status === "PREPARING"
                          ? "bg-amber-100 text-amber-800"
                          : order.status === "COMPLETED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-stone-200 text-stone-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 flex flex-wrap gap-3">
                    <span>
                      موعد الاستلام:{" "}
                      <b className="font-outfit text-stone-800 dark:text-stone-200">
                        {new Date(order.requestedPickupTime).toLocaleTimeString(
                          language === "ar" ? "ar-YE" : "en-US",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </b>
                    </span>
                    <span>
                      الإجمالي:{" "}
                      <b className="font-outfit text-pizza-700 dark:text-pizza-400">
                        {order.total.toLocaleString()} {dict.menu.currency}
                      </b>
                    </span>
                    <span>
                      الأصناف:{" "}
                      {order.items
                        .map((i: any) => `${i.quantity}x ${i.productNameAr}`)
                        .join("، ")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/track/${order.id}?token=${order.trackingToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700"
                    title="معاينة صفحة التتبع"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {order.status === "READY" && (
                    <button
                      onClick={() =>
                        updateOrderStatusAction(order.id, "COMPLETED", "الكاشير")
                      }
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      تم تسليم العميل
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Transfer Payments Verification */}
      {activeTab === "payments" && (
        <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white font-cairo">
                {dict.admin.payments}
              </h3>
              <p className="text-xs text-stone-500">
                مراجعة إشعارات الحوالات البنكية (كريمي، العمقي، البسيري) واعتمادها
              </p>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-outfit">
              {pendingPayments.length} إشعارات معلقة
            </span>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">
                لا توجد تحويلات معلقة للمراجعة
              </h4>
              <p className="text-xs text-stone-500">
                جميع طلبات التحويل البنكي تم تدقيقها واعتمادها بنجاح.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black font-outfit text-stone-900 dark:text-white">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        {order.customerName} ({order.customerPhone})
                      </span>
                      <span className="text-xs font-bold font-outfit text-pizza-700">
                        {order.total.toLocaleString()} {dict.menu.currency}
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 dark:text-stone-400 flex flex-wrap gap-4">
                      <span>
                        البنك / الصرافة: <b>{order.payment?.method}</b>
                      </span>
                      {order.payment?.referenceNumber && (
                        <span>
                          الرقم المرجعي:{" "}
                          <b className="font-outfit text-stone-900 dark:text-white">
                            {order.payment.referenceNumber}
                          </b>
                        </span>
                      )}
                      <span>
                        الموعد المفضل:{" "}
                        <b className="font-outfit">
                          {new Date(order.requestedPickupTime).toLocaleTimeString(
                            language === "ar" ? "ar-YE" : "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </b>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {order.payment?.receipt?.fileUrl ? (
                      <button
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة الإشعار</span>
                      </button>
                    ) : (
                      <span className="text-xs text-red-500 font-bold">
                        لم يُرفق صورة
                      </span>
                    )}

                    <button
                      onClick={() => handleVerifyPayment(order.id, true)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      {dict.admin.approve}
                    </button>

                    <button
                      onClick={() => {
                        const reason = prompt(
                          dict.admin.rejectReasonPrompt,
                          "المبلغ غير مطابق للإجمالي"
                        );
                        if (reason) {
                          handleVerifyPayment(order.id, false, reason);
                        }
                      }}
                      disabled={isProcessing}
                      className="px-3 py-2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-200 text-xs font-bold rounded-xl transition-colors"
                    >
                      {dict.admin.reject}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Menu & Pricing Quick Stock Toggle */}
      {activeTab === "menu" && (
        <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white font-cairo">
                {dict.admin.menuMgmt}
              </h3>
              <p className="text-xs text-stone-500">
                التحكم بتوفر الأصناف فوراً (متوفر / نفدت الكمية)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={prod.imageUrl}
                    alt={prod.nameAr}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                      {prod.nameAr}
                    </h4>
                    <span className="text-[11px] font-outfit text-pizza-700 font-bold">
                      {prod.basePrice.toLocaleString()} {dict.menu.currency}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleAvailability(prod.id, prod.isAvailable)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    prod.isAvailable
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                >
                  {prod.isAvailable ? dict.admin.markAvailable : dict.admin.markSoldOut}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Operational Settings & Emergency Pause */}
      {activeTab === "settings" && (
        <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6 max-w-2xl">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-900 dark:text-white font-cairo">
              {dict.admin.pauseOrdering}
            </h3>
            <p className="text-xs text-stone-500">{dict.admin.pauseOrderingDesc}</p>
          </div>

          <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-stone-900 dark:text-white">
                حالة استقبال الطلبات الرقمية:
              </span>
              <button
                onClick={handleTogglePause}
                disabled={isProcessing}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${
                  isPaused
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isPaused ? (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    <span>إعادة استئناف الطلبات</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-4 h-4" />
                    <span>إيقاف مؤقت للطلبات</span>
                  </>
                )}
              </button>
            </div>

            {isPaused && (
              <div className="space-y-1.5 pt-3 border-t border-stone-200 dark:border-stone-700">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  رسالة التنبيه المعروضة للزبائن:
                </label>
                <input
                  type="text"
                  value={pauseMessage}
                  onChange={(e) => setPauseMessage(e.target.value)}
                  placeholder="نعتذر، تم إيقاف استقبال الطلبات مؤقتاً..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt Inspection Modal */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full overflow-hidden border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 p-5">
            <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  معاينة إشعار التحويل • {selectedReceiptOrder.orderNumber}
                </h3>
                <p className="text-xs text-stone-500">
                  المرسل: {selectedReceiptOrder.customerName} (
                  {selectedReceiptOrder.payment?.amount?.toLocaleString()}{" "}
                  {dict.menu.currency})
                </p>
              </div>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 max-h-96 flex items-center justify-center bg-black">
              <img
                src={selectedReceiptOrder.payment?.receipt?.fileUrl}
                alt="Receipt Full Preview"
                className="max-h-96 w-full object-contain"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold"
              >
                إغلاق
              </button>
              <button
                onClick={() => handleVerifyPayment(selectedReceiptOrder.id, true)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                اعتماد وتأكيد التحويل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
