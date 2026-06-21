import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Brain, BarChart3, Clock, Compass, Target,
  Send, Sparkles, LogIn, UserPlus, ArrowRight, CheckCircle2, GraduationCap
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { Card, Button, Input, Textarea } from '../components/common';
import showToast from '../utils/toast';

export const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      showToast.error('Please fill in all contact form fields.');
      return;
    }

    setSubmittingContact(true);
    setTimeout(() => {
      showToast.success('Thank you for reaching out! Our team will contact you shortly.');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setSubmittingContact(false);
    }, 1000);
  };

  const handleDashboardRedirect = () => {
    if (user) {
      navigate(`/${user.role}/dashboard`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-200 antialiased font-sans transition-colors duration-200 relative overflow-hidden">

      {/* Background blobs for premium SaaS ambient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-primary-500/5 dark:bg-primary-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl pointer-events-none"></div>

      {/* 1. HEADER / NAVIGATION */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-dark-950/80 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-1.5 bg-primary-500/10 border border-primary-500/20 rounded-lg">
              <GraduationCap className="w-6 h-6 text-primary-500" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
              ExamPortal
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-primary-500 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary-500 transition-colors">How It Works</a>
            <a href="#benefits" className="hover:text-primary-500 transition-colors">Benefits</a>
            <a href="#contact" className="hover:text-primary-500 transition-colors">Contact</a>
          </nav>

          {/* Authentication actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <Button
                onClick={handleDashboardRedirect}
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  icon={LogIn}
                  className="hidden sm:inline-flex"
                >
                  Log In
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/register')}
                  icon={UserPlus}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 sm:pt-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Empowering Modern Education
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-heading leading-tight">
            Assessments Made <span className="bg-gradient-to-r from-primary-500 to-indigo-500 bg-clip-text text-transparent">Intelligent</span>, Secure, and Effortless.
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
            A state-of-the-art SaaS platform designed for teachers, students, and administrators to generate smart exams, monitor attempts with proctoring safeguards, and analyze performance logs dynamically.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <Button
              size="lg"
              onClick={handleDashboardRedirect}
              icon={ArrowRight}
              iconPosition="right"
              className="px-8"
            >
              {user ? 'Go to Dashboard' : 'Start Assessment'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 border-slate-200 dark:border-slate-800"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Hero Interactive CSS Mockup */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-lg glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-2xl relative animate-[scaleIn_0.35s_ease-out] hover:scale-[1.01] transition-transform duration-300">
            {/* Top Mockup Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-4 mb-5">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider">examportal-admin-console</span>
            </div>

            {/* Mockup Dashboard content */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl space-y-1 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Score</span>
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">88.5%</div>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl space-y-1 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Passing %</span>
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">94.2%</div>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl space-y-1 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Plagiarism</span>
                  <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">0.02%</div>
                </div>
              </div>

              {/* Chart Mockup */}
              <div className="p-4 bg-slate-100 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-2">
                <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Registration Volume</span>
                <div className="h-28 flex items-end gap-3 pt-2">
                  {[25, 45, 30, 70, 55, 90].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div style={{ height: `${h}%` }} className="w-full bg-gradient-to-t from-primary-600 to-indigo-500 rounded-t-md"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200 dark:border-slate-900/50">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-heading">
            Packed with Powerful SaaS Utilities
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
            Every feature you need to author, run, evaluate and monitor assessments seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <Card hoverable={true} className="p-6 space-y-4 hover:border-blue-500/20">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">AI Exam Generator</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Auto-generate balanced assessments from difficulty parameters, blueprints, or chapter distributions instantly.
            </p>
          </Card>

          {/* Card 2 */}
          <Card hoverable={true} className="p-6 space-y-4 hover:border-purple-500/20">
            <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-500">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Proctoring Security</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Keep attempts secure with fullscreen locks, tab focus triggers, copy-paste locks, and instant anomaly loggers.
            </p>
          </Card>

          {/* Card 3 */}
          <Card hoverable={true} className="p-6 space-y-4 hover:border-emerald-500/20">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Audit Logs & Ledger</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Trace logins, logouts, question edits, and submissions with a comprehensive searchable ledger built for admins.
            </p>
          </Card>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="bg-slate-100/40 dark:bg-dark-900/10 py-20 border-y border-slate-200 dark:border-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-heading">
              Assessments in Three Easy Steps
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
              Our intuitive workflows ensure teachers and students get the best online assessment experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-extrabold text-lg shadow-lg shadow-primary-500/20">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Author & Configure</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                Teachers draft exams manually or auto-generate them. Set configurations like shuffles, time bounds, and back nav limits.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-extrabold text-lg shadow-lg shadow-primary-500/20">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Attempt Securely</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                Students enter the testing engine. Fullscreen monitors and anti-cheating scripts ensure assessment integrity.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-extrabold text-lg shadow-lg shadow-primary-500/20">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Evaluate & Release</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                Teachers grade subjective content and release reports. Grades and feedback remarks sync directly to student dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BENEFITS SECTION */}
      <section id="benefits" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-heading">
            Empowering All Platform Stakeholders
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
            Custom-built views and benefits tailored for teachers, students, and system admins.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Column Left: Visual Checklist */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Why Academics Choose ExamPortal</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">Save Hours of Manual Authoring</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Generate complex question distributions in seconds with smart auto-selection.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">Mitigate Academic Malpractice</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Proctoring algorithms detect window blurring, screen changes, and copy-paste attempts.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">Transparent Result Dashboards</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Export detailed reports as CSV/Excel files and release graded transcripts securely.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column Right: Details Card */}
          <Card hoverable={false} className="p-6 sm:p-8 bg-gradient-to-br from-primary-650/5 to-indigo-650/5 border border-primary-500/10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary-500 mb-4">Value Proposition</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-slate-850 dark:text-slate-100">80%</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Grading Time Saved</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-slate-850 dark:text-slate-100">99.8%</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">System Uptime SLA</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-slate-850 dark:text-slate-100">10k+</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Exams Hosted</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-slate-850 dark:text-slate-100">0%</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Plagiarism Violations</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 6. CONTACT SECTION */}
      <section id="contact" className="max-w-4xl mx-auto px-6 py-20">
        <Card hoverable={false} className="p-8 sm:p-12 relative overflow-hidden">
          {/* Subtle background glow inside Card */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left side details */}
            <div className="md:col-span-5 space-y-4 text-center md:text-left">
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-heading">
                Ready to Upgrade?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Contact our support team to register your school, purchase institutional plan tiers, or request custom features.
              </p>
              <div className="text-xs text-slate-450 dark:text-slate-500">
                Email: <strong>support@examportal.edu</strong><br />
                Hours: <strong>9 AM - 6 PM EST</strong>
              </div>
            </div>

            {/* Right side contact form */}
            <form onSubmit={handleContactSubmit} className="md:col-span-7 space-y-4">
              <Input
                label="Full Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="John Doe"
              />
              <Input
                label="Email Address"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="john@example.com"
              />
              <Textarea
                label="Your Message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Tell us about your organization and requirements..."
                rows={4}
              />
              <Button
                type="submit"
                isLoading={submittingContact}
                icon={Send}
                className="w-full py-2.5"
              >
                Send Message
              </Button>
            </form>
          </div>
        </Card>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-dark-950/20 py-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary-500" />
            <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-200">
              ExamPortal © 2026
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Secure Assessment Delivery & AI Proctoring Infrastructure. All Rights Reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
