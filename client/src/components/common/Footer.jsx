import React from 'react';
import { BookMarked } from 'lucide-react';

export const Footer = ({ isContained = false, className = "" }) => {
  return (
    <footer className={`w-full bg-white dark:bg-[#070D18] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 font-sans transition-colors ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <BookMarked className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">BridgeAI</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Training &amp; Examination Portal</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Learn. Build. Grow. A unified digital ecosystem connecting students, faculty trainers, and institutions for structured training and proctored examinations.
            </p>

            <div className="pt-2 text-xs text-slate-500 space-y-1">
              <p>Designed for universities, colleges, and training academies across India.</p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">Empowering 10,000+ academic learners.</p>
            </div>
          </div>

          {/* Col 1: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#platform-features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Courses &amp; Modules</a></li>
              <li><a href="#platform-features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Structured Training</a></li>
              <li><a href="#assessment-experience" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Online Assessments</a></li>
              <li><a href="#assessment-experience" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Coding Evaluations</a></li>
              <li><a href="#platform-features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Verified Certifications</a></li>
            </ul>
          </div>

          {/* Col 2: For Everyone */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">Solutions</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#built-for-everyone" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">For Students</a></li>
              <li><a href="#built-for-everyone" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">For Trainers</a></li>
              <li><a href="#built-for-everyone" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">For Institutions</a></li>
              <li><a href="#why-bridgeai" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Security &amp; Proctoring</a></li>
              <li><a href="#product-showcase" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Live Demonstrations</a></li>
            </ul>
          </div>

          {/* Col 3: Resources & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">Resources &amp; Trust</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Help Center &amp; FAQ</a></li>
              <li><span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</span></li>
              <li><span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</span></li>
              <li><span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">System Status</span></li>
              <li><span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Institution Partnership</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>(c) 2026 BridgeAI. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <span>Role-Based Access Control</span>
            <span>•</span>
            <span>Safe Browsing Proctored Exams</span>
            <span>•</span>
            <span>AI Coding Sandbox</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
