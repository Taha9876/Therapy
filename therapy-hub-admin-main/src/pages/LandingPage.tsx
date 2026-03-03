import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Brain,
  Stethoscope,
  Users,
  ShieldCheck,
  ArrowRight,
  Heart,
  MessageCircle,
  CalendarCheck,
  Activity,
  Sparkles,
  Shield,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type RoleTab = "patient" | "doctor" | "admin";
const LandingPage = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [activeRole, setActiveRole] = useState<RoleTab>("patient");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [goal, setGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, role, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const authRef = useRef<HTMLDivElement>(null);
  // Intersection Observer for scroll-triggered animations
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  const resetFields = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setSpecialization("");
    setAge("");
    setGender("");
    setGoal("");
  };
  const handleDashboardRedirect = (targetRole: RoleTab) => {
    if (user) {
      if (role === "admin") navigate("/dashboard");
      else if (role === "doctor") navigate("/doctor/dashboard");
      else navigate("/patient/dashboard");
      return;
    }
    openAuth(targetRole);
  };
  const openAuth = (role: RoleTab) => {
    setActiveRole(role);
    setMode("login");
    resetFields();
    setShowAuth(true);
    setTimeout(() => {
      authRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Login failed", description: error, variant: "destructive" });
      } else {
        navigate("/");
      }
    } else {
      if (activeRole === "admin") {
        toast({ title: "Admin signup disabled", description: "Admin accounts cannot be created via signup.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const metadata: Record<string, string> = {
        full_name: fullName,
        role: activeRole,
      };
      if (activeRole === "doctor") {
        metadata.specialization = specialization;
      } else {
        if (age) metadata.age = age;
        metadata.gender = gender;
        metadata.goal = goal;
      }
      const { error } = await signUp(email, password, metadata);
      if (error) {
        toast({ title: "Signup failed", description: error, variant: "destructive" });
      } else {
        toast({ title: "Account created!", description: "You can now sign in." });
        setMode("login");
        resetFields();
      }
    }
    setSubmitting(false);
  };
  const features = [
    {
      icon: <MessageCircle className="h-7 w-7" />,
      title: "Live Chat with Doctors",
      description: "Connect instantly with licensed therapists through secure real-time messaging.",
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      icon: <Activity className="h-7 w-7" />,
      title: "Smart Assessments",
      description: "AI-powered mental health assessments to track your progress and well-being.",
      gradient: "from-violet-500 to-purple-400",
    },
    {
      icon: <CalendarCheck className="h-7 w-7" />,
      title: "Easy Appointments",
      description: "Schedule and manage therapy sessions with just a few clicks.",
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      icon: <Shield className="h-7 w-7" />,
      title: "Privacy & Security",
      description: "End-to-end encryption ensures your conversations remain completely private.",
      gradient: "from-amber-500 to-orange-400",
    },
  ];
  const stats = [
    { value: "10K+", label: "Active Patients" },
    { value: "500+", label: "Licensed Doctors" },
    { value: "50K+", label: "Sessions Completed" },
    { value: "98%", label: "Satisfaction Rate" },
  ];
  return (
    <div className="min-h-screen overflow-hidden">
      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 20%, #0d9488 40%, #7c3aed 60%, #1e3a5f 80%, #0f172a 100%)",
            backgroundSize: "400% 400%",
          }}
        />
        {/* Overlay pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        {/* Floating orbs */}
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-teal-500/20 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full bg-purple-500/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-3xl animate-pulse-glow" />
        {/* Hero content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="inline-flex items-center justify-center mb-8 animate-scale-in">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-400/30 rounded-3xl blur-xl animate-pulse-glow" />
              <div className="relative flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl px-6 py-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">Smart Mental Health</span>
              </div>
            </div>
          </div>
          {/* Headline */}
          <h1
            className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight animate-slide-up"
            style={{ animationDelay: "0.2s", opacity: 0 }}
          >
            Your Journey to{" "}
            <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Mental Wellness
            </span>{" "}
            Starts Here
          </h1>
          {/* Subtitle */}
          <p
            className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 animate-slide-up"
            style={{ animationDelay: "0.4s", opacity: 0 }}
          >
            Connect with licensed therapists, take smart assessments, and track your mental health journey
            — all from one secure platform.
          </p>
          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
            style={{ animationDelay: "0.6s", opacity: 0 }}
          >
            <Button
              onClick={() => handleDashboardRedirect("patient")}
              size="lg"
              className="group relative px-8 py-6 text-lg font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white border-0 rounded-2xl shadow-2xl shadow-teal-500/30 transition-all duration-300 hover:scale-105 hover:shadow-teal-500/50"
            >
              {user ? (
                <>Go to Dashboard <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" /></>
              ) : (
                <><Sparkles className="h-5 w-5 mr-2" /> Get Started Free <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" /></>
              )}
            </Button>
            {!user && (
              <Button
                onClick={() => handleDashboardRedirect("doctor")}
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-semibold bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white rounded-2xl transition-all duration-300 hover:scale-105"
              >
                <Stethoscope className="h-5 w-5 mr-2" />
                Join as Doctor
              </Button>
            )}
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
          <ChevronDown className="h-8 w-8 text-white/40" />
        </div>
      </section>
      {/* ── STATS BAR ── */}
      <section className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-12 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400 mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
      {/* ── FEATURES SECTION ── */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-slate-900 to-slate-950">
        <div id="features-section" data-animate className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${visibleSections.has("features-section") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="h-4 w-4 text-teal-400" />
              <span className="text-sm font-medium text-teal-400">Powerful Features</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              Everything You Need for{" "}
              <span className="bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
                Better Mental Health
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Our platform provides comprehensive tools for patients, doctors, and administrators.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                id={`feature-${i}`}
                data-animate
                className={`group relative rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm p-8 transition-all duration-500 hover:bg-white/10 hover:border-white/10 hover:shadow-2xl hover:-translate-y-1 cursor-default ${visibleSections.has(`feature-${i}`) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-5 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── GET STARTED / ROLE CARDS ── */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #0f172a 100%)",
            backgroundSize: "300% 300%",
          }}
        />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
        <div id="roles-section" data-animate className="relative z-10 max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${visibleSections.has("roles-section") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              Get Started as
            </h2>
            <p className="text-slate-400 text-lg">Choose your role and begin your journey</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Patient Card */}
            <div className={`group relative rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 ${visibleSections.has("roles-section") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`} style={{ transitionDelay: "100ms" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-3xl" />
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full flex flex-col group-hover:border-teal-500/30 transition-colors">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-shadow">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Patient</h3>
                <p className="text-slate-400 mb-6 flex-1 leading-relaxed">
                  Take assessments, chat with therapists, book appointments, and track your mental wellness journey.
                </p>
                <ul className="space-y-2 mb-8 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><Heart className="h-4 w-4 text-teal-400" /> Personalized assessments</li>
                  <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-teal-400" /> Chat with doctors</li>
                  <li className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-teal-400" /> Book appointments</li>
                </ul>
                <Button
                  onClick={() => handleDashboardRedirect("patient")}
                  className="w-full py-6 text-base font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white border-0 rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-300 group-hover:scale-[1.02]"
                >
                  {user ? "Go to Dashboard" : "Get Started as Patient"}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
            {/* Doctor Card */}
            <div className={`group relative rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 ${visibleSections.has("roles-section") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`} style={{ transitionDelay: "200ms" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl" />
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full flex flex-col group-hover:border-violet-500/30 transition-colors">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Doctor</h3>
                <p className="text-slate-400 mb-6 flex-1 leading-relaxed">
                  Manage patients, monitor progress, conduct sessions, and provide care through our platform.
                </p>
                <ul className="space-y-2 mb-8 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><Users className="h-4 w-4 text-violet-400" /> Patient management</li>
                  <li className="flex items-center gap-2"><Activity className="h-4 w-4 text-violet-400" /> Progress monitoring</li>
                  <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-violet-400" /> Secure messaging</li>
                </ul>
                <Button
                  onClick={() => handleDashboardRedirect("doctor")}
                  className="w-full py-6 text-base font-semibold bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white border-0 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all duration-300 group-hover:scale-[1.02]"
                >
                  {user ? "Go to Dashboard" : "Get Started as Doctor"}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
            {/* Admin Card */}
            <div className={`group relative rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 ${visibleSections.has("roles-section") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`} style={{ transitionDelay: "300ms" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl" />
              <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full flex flex-col group-hover:border-amber-500/30 transition-colors">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Admin</h3>
                <p className="text-slate-400 mb-6 flex-1 leading-relaxed">
                  Oversee operations, manage users, monitor platform health, and ensure quality care delivery.
                </p>
                <ul className="space-y-2 mb-8 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-amber-400" /> Platform oversight</li>
                  <li className="flex items-center gap-2"><Users className="h-4 w-4 text-amber-400" /> User management</li>
                  <li className="flex items-center gap-2"><Activity className="h-4 w-4 text-amber-400" /> Analytics dashboard</li>
                </ul>
                <Button
                  onClick={() => handleDashboardRedirect("admin")}
                  className="w-full py-6 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-0 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all duration-300 group-hover:scale-[1.02]"
                >
                  {user ? "Go to Dashboard" : "Admin Sign In"}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ── AUTH SECTION ── */}
      {showAuth && !user && (
        <section ref={authRef} className="relative py-20 px-4 bg-slate-950">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-3xl" />
          </div>
          <div className="relative z-10 w-full max-w-md mx-auto animate-scale-in">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl">
              <Tabs
                value={activeRole}
                onValueChange={(v) => {
                  setActiveRole(v as RoleTab);
                  resetFields();
                  if (v === "admin") setMode("login");
                }}
              >
                <TabsList className="mb-6 w-full bg-white/5 border border-white/10 rounded-xl p-1">
                  <TabsTrigger value="patient" className="flex-1 gap-2 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg transition-all">
                    <Users className="h-4 w-4" /> Patient
                  </TabsTrigger>
                  <TabsTrigger value="doctor" className="flex-1 gap-2 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all">
                    <Stethoscope className="h-4 w-4" /> Doctor
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex-1 gap-2 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg transition-all">
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </TabsTrigger>
                </TabsList>
                <TabsContent value={activeRole}>
                  {/* Mode toggle */}
                  {activeRole !== "admin" && (
                    <div className="mb-5 flex gap-2">
                      <Button
                        type="button"
                        variant={mode === "login" ? "default" : "outline"}
                        className={`flex-1 rounded-xl transition-all ${mode === "login" ? "bg-white/15 text-white border-white/20" : "bg-transparent text-white/60 border-white/10 hover:text-white hover:bg-white/5"}`}
                        onClick={() => { setMode("login"); resetFields(); }}
                      >
                        Sign In
                      </Button>
                      <Button
                        type="button"
                        variant={mode === "signup" ? "default" : "outline"}
                        className={`flex-1 rounded-xl transition-all ${mode === "signup" ? "bg-white/15 text-white border-white/20" : "bg-transparent text-white/60 border-white/10 hover:text-white hover:bg-white/5"}`}
                        onClick={() => { setMode("signup"); resetFields(); }}
                      >
                        Sign Up
                      </Button>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "signup" && activeRole !== "admin" && (
                      <div className="space-y-2">
                        <Label className="text-white/80">Full Name</Label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-teal-500/50 focus:ring-teal-500/20" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-white/80">Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={activeRole === "admin" ? "admin@smarttherapy.com" : "you@example.com"}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-teal-500/50 focus:ring-teal-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Password</Label>
                      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-teal-500/50 focus:ring-teal-500/20" />
                    </div>
                    {/* Doctor signup fields */}
                    {mode === "signup" && activeRole === "doctor" && (
                      <div className="space-y-2">
                        <Label className="text-white/80">Specialization</Label>
                        <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Cognitive Behavioral Therapy" required className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-teal-500/50 focus:ring-teal-500/20" />
                      </div>
                    )}
                    {/* Patient signup fields */}
                    {mode === "signup" && activeRole === "patient" && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-white/80">Age</Label>
                            <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-teal-500/50 focus:ring-teal-500/20" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white/80">Gender</Label>
                            <Select value={gender} onValueChange={setGender}>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/80">Mental Health Goal</Label>
                          <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Manage Anxiety" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-teal-500/50 focus:ring-teal-500/20" />
                        </div>
                      </>
                    )}
                    <Button
                      type="submit"
                      className={`w-full py-6 text-base font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] ${activeRole === "patient"
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 shadow-teal-500/20"
                        : activeRole === "doctor"
                          ? "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 shadow-violet-500/20"
                          : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/20"
                        } text-white border-0`}
                      disabled={submitting}
                    >
                      {submitting ? "Please wait..." : (
                        <>
                          {mode === "login" ? "Sign In" : "Create Account"}
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                  {activeRole === "admin" && (
                    <p className="mt-4 text-center text-xs text-white/40">
                      Admin login only. Contact system administrator for access.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>
      )}
      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">Smart Mental Health</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Smart Mental Health. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">Privacy</a>
            <a href="#" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">Terms</a>
            <a href="#" className="text-sm text-slate-400 hover:text-teal-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
