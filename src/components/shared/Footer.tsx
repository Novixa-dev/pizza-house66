"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import {
  Pizza,
  MapPin,
  Phone,
  Clock,
  Instagram,
  Heart,
  ExternalLink,
} from "lucide-react";

export default function Footer() {
  const { dict } = useApp();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-stone-800">
          {/* Col 1: Brand & Slogan */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pizza-600 flex items-center justify-center text-white">
                <Pizza className="w-5 h-5 text-amber-300" />
              </div>
              <span className="text-xl font-black text-white font-cairo">
                {dict.brand.name}
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              متخصصون في عمل أشهى أنواع البيتزا الإيطالية والفطائر الطازجة في المكلا بعجينة يومية ومكونات فاخرة مخبوزة على الحجر.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/pizza_house66/"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-pizza-600 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Instagram @pizza_house66"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/967772207788"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-emerald-600 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="WhatsApp 772207788"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Operating Hours */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-crust-400" />
              <span>أوقات العمل الرسمية</span>
            </h4>
            <ul className="text-xs text-stone-400 space-y-2">
              <li className="flex justify-between border-b border-stone-800/60 pb-1.5">
                <span>السبت – الخميس (صباحاً):</span>
                <span className="text-stone-200 font-outfit">8:00 AM – 12:00 PM</span>
              </li>
              <li className="flex justify-between border-b border-stone-800/60 pb-1.5">
                <span>السبت – الخميس (مساءً):</span>
                <span className="text-stone-200 font-outfit">4:00 PM – 11:30 PM</span>
              </li>
              <li className="flex justify-between">
                <span>الجمعة:</span>
                <span className="text-stone-200 font-outfit">4:00 PM – 11:30 PM</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Location & Contacts */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-pizza-400" />
              <span>العنوان والتواصل</span>
            </h4>
            <div className="text-xs text-stone-400 space-y-2">
              <p className="leading-relaxed">
                حضرموت، المكلا، فوه، حي المساكن (بالقرب من مستوصف النور وجامعة الأحقاف ومدرسة السلال).
              </p>
              <p className="font-outfit text-stone-200">
                هاتف أرضي: <span className="text-pizza-400">05375561</span>
              </p>
              <p className="font-outfit text-stone-200">
                واتساب / جوال: <span className="text-emerald-400">+967 772207788</span>
              </p>
            </div>
          </div>

          {/* Col 4: Quick Links & Platform */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              روابط سريعة
            </h4>
            <ul className="text-xs space-y-2">
              <li>
                <a href="/menu" className="hover:text-pizza-400 transition-colors">
                  قائمة البيتزا والفطائر
                </a>
              </li>
              <li>
                <a href="/track" className="hover:text-pizza-400 transition-colors">
                  متابعة حالة طلب سابق
                </a>
              </li>
              <li>
                <a href="/kitchen" className="hover:text-pizza-400 transition-colors flex items-center gap-1">
                  <span>شاشة إدارة المطبخ (KDS)</span>
                  <ExternalLink className="w-3 h-3 text-stone-500" />
                </a>
              </li>
              <li>
                <a href="/admin" className="hover:text-pizza-400 transition-colors flex items-center gap-1">
                  <span>لوحة تحكم الإدارة</span>
                  <ExternalLink className="w-3 h-3 text-stone-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Brand & Novixa Restaurant Reference */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-stone-500">
          <p>
            جميع الحقوق محفوظة © {new Date().getFullYear()} مطعم بيتزا هاوس المكلا (Pizza House).
          </p>
          <div className="flex items-center gap-1.5">
            <span>مدعوم بواسطة منصة العمليات الرقمية للمطاعم</span>
            <span className="font-bold text-crust-400 font-outfit">Novixa Restaurant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
