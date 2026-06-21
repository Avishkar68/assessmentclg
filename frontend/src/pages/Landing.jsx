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
    <div className="min-h-screen bg-[#F8F8F8] text-[#111827] antialiased font-sans relative overflow-hidden">

      {/* 1. HEADER / NAVIGATION */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo Branding */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-1.5 bg-neutral-900 border border-neutral-850 rounded-lg text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-neutral-900">
              FAVProct
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            <a href="#features" className="hover:text-neutral-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-neutral-900 transition-colors">How It Works</a>
            <a href="#benefits" className="hover:text-neutral-900 transition-colors">Benefits</a>
            <a href="#contact" className="hover:text-neutral-900 transition-colors">Contact</a>
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
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-full text-[10px] font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
            Empowering Modern Education
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-tight">
            Assessments Made Intelligent, Secure, and Effortless.
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 leading-relaxed max-w-xl mx-auto lg:mx-0">
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
              className="px-8 border-neutral-200 text-neutral-700"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Hero Interactive CSS Mockup */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-neutral-200 shadow-md relative hover:translate-y-[-2px] transition-transform duration-300">
            {/* Top Mockup Header Bar */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-200"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-200"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-200"></span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono tracking-wider">examportal-admin-console</span>
            </div>

            {/* Mockup Dashboard content */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1 text-center">
                  <span className="text-[9px] font-semibold text-neutral-450 uppercase block">Avg Score</span>
                  <div className="text-sm font-bold text-neutral-900">88.5%</div>
                </div>
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1 text-center">
                  <span className="text-[9px] font-semibold text-neutral-455 uppercase block">Passing %</span>
                  <div className="text-sm font-bold text-emerald-600">94.2%</div>
                </div>
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1 text-center">
                  <span className="text-[9px] font-semibold text-neutral-450 uppercase block">Plagiarism</span>
                  <div className="text-sm font-bold text-neutral-900">0.02%</div>
                </div>
              </div>

              {/* Chart Mockup */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                <span className="text-[9px] font-semibold uppercase text-neutral-450 tracking-wider block">Registration Volume</span>
                <div className="h-28 flex items-end gap-3 pt-2">
                  {[25, 45, 30, 70, 55, 90].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div style={{ height: `${h}%` }} className="w-full bg-neutral-900 rounded-t-md hover:bg-neutral-800 transition-all duration-300"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-neutral-200">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
            Packed with Powerful SaaS Utilities
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 leading-normal">
            Every feature you need to author, run, evaluate and monitor assessments seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <Card hoverable={true} className="p-6 space-y-4">
            <Card.Body className="space-y-4">
              <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-800">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900">AI Exam Generator</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Auto-generate balanced assessments from difficulty parameters, blueprints, or chapter distributions instantly.
              </p>
            </Card.Body>
          </Card>

          {/* Card 2 */}
          <Card hoverable={true} className="p-6 space-y-4">
            <Card.Body className="space-y-4">
              <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-800">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900">Proctoring Security</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Keep attempts secure with fullscreen locks, tab focus triggers, copy-paste locks, and instant anomaly loggers.
              </p>
            </Card.Body>
          </Card>

          {/* Card 3 */}
          <Card hoverable={true} className="p-6 space-y-4">
            <Card.Body className="space-y-4">
              <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-800">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900">Audit Logs & Ledger</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Trace logins, logouts, question edits, and submissions with a comprehensive searchable ledger built for admins.
              </p>
            </Card.Body>
          </Card>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="bg-neutral-50 py-20 border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
              Assessments in Three Easy Steps
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 leading-normal">
              Our intuitive workflows ensure teachers and students get the best online assessment experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-lg border border-neutral-800 shadow-xs">
                1
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">Author & Configure</h3>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
                Teachers draft exams manually or auto-generate them. Set configurations like shuffles, time bounds, and back nav limits.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-lg border border-neutral-800 shadow-xs">
                2
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">Attempt Securely</h3>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
                Students enter the testing engine. Fullscreen monitors and anti-cheating scripts ensure assessment integrity.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-lg border border-neutral-800 shadow-xs">
                3
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">Evaluate & Release</h3>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
                Teachers grade subjective content and release reports. Grades and feedback remarks sync directly to student dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BENEFITS SECTION */}
      <section id="benefits" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
            Empowering All Platform Stakeholders
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 leading-normal">
            Custom-built views and benefits tailored for teachers, students, and system admins.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Column Left: Visual Checklist */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-neutral-900">Why Academics Choose ExamPortal</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800">Save Hours of Manual Authoring</h4>
                  <p className="text-xs text-neutral-500">Generate complex question distributions in seconds with smart auto-selection.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800">Mitigate Academic Malpractice</h4>
                  <p className="text-xs text-neutral-500">Proctoring algorithms detect window blurring, screen changes, and copy-paste attempts.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800">Transparent Result Dashboards</h4>
                  <p className="text-xs text-neutral-500">Export detailed reports as CSV/Excel files and release graded transcripts securely.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column Right: Details Card */}
          <Card className="p-6 sm:p-8 bg-neutral-50 border border-neutral-200">
            <Card.Body className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">Value Proposition</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-0.5">
                  <div className="text-2xl font-bold text-neutral-900">80%</div>
                  <div className="text-[10px] uppercase font-semibold text-neutral-400">Grading Time Saved</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-bold text-neutral-900">99.8%</div>
                  <div className="text-[10px] uppercase font-semibold text-neutral-400">System Uptime SLA</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-bold text-neutral-900">10k+</div>
                  <div className="text-[10px] uppercase font-semibold text-neutral-400">Exams Hosted</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-bold text-neutral-900">0%</div>
                  <div className="text-[10px] uppercase font-semibold text-neutral-400">Plagiarism Violations</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </section>

      {/* 6. CONTACT SECTION */}
      <section id="contact" className="max-w-4xl mx-auto px-6 py-20">
        <Card className="p-8 sm:p-12 relative overflow-hidden">
          <Card.Body className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left side details */}
              <div className="md:col-span-5 space-y-4 text-center md:text-left">
                <h3 className="text-2xl font-bold text-neutral-900">
                  Ready to Upgrade?
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Contact our support team to register your school, purchase institutional plan tiers, or request custom features.
                </p>
                <div className="text-xs text-neutral-500 space-y-1">
                  <p>Email: <span className="font-semibold text-neutral-900">support@examportal.edu</span></p>
                  <p>Hours: <span className="font-semibold text-neutral-900">9 AM - 6 PM EST</span></p>
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
          </Card.Body>
        </Card>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-neutral-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-neutral-900 border border-neutral-850 rounded-lg text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-neutral-900">
              FAVProct © 2026
            </span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Secure Assessment Delivery & AI Proctoring Infrastructure. All Rights Reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
