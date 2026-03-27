-- ============================================
-- CLEAN MIGRATION - Tables & Policies Only
-- DO NOT insert into auth.users via SQL!
-- Create admin via Dashboard > Authentication > Users > Add User
-- ============================================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'patient');

-- Helper function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1 $$;

-- Doctors
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  availability TEXT DEFAULT 'Mon-Fri, 9AM-5PM',
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Active', 'Inactive', 'Pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Patients
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER,
  gender TEXT DEFAULT '',
  goal TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  assigned_doctor_id UUID REFERENCES public.doctors(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- MCQ Questions
CREATE TABLE public.mcq_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Stress', 'Anxiety', 'Depression')),
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mcq_questions ENABLE ROW LEVEL SECURITY;

-- Assessments
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  stress_score INTEGER NOT NULL DEFAULT 0,
  anxiety_score INTEGER NOT NULL DEFAULT 0,
  depression_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'Low' CHECK (risk_level IN ('Low', 'Medium', 'High')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Scoring config
CREATE TABLE public.scoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  low_min INTEGER NOT NULL DEFAULT 0,
  low_max INTEGER NOT NULL DEFAULT 5,
  medium_min INTEGER NOT NULL DEFAULT 6,
  medium_max INTEGER NOT NULL DEFAULT 10,
  high_min INTEGER NOT NULL DEFAULT 11,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scoring_config ENABLE ROW LEVEL SECURITY;

INSERT INTO public.scoring_config (low_min, low_max, medium_min, medium_max, high_min) 
VALUES (0, 5, 6, 10, 11);

-- Trigger for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role app_role; _full_name TEXT;
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient');
  INSERT INTO public.profiles (user_id, full_name) VALUES (NEW.id, _full_name);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  IF _role = 'doctor' THEN
    INSERT INTO public.doctors (user_id, specialization)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'specialization', ''));
  ELSIF _role = 'patient' THEN
    INSERT INTO public.patients (user_id, age, gender, goal)
    VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'age')::integer, NULL),
      COALESCE(NEW.raw_user_meta_data->>'gender', ''),
      COALESCE(NEW.raw_user_meta_data->>'goal', ''));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mcq_updated_at BEFORE UPDATE ON public.mcq_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read doctors" ON public.doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage doctors" ON public.doctors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Doctors can update own" ON public.doctors FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage patients" ON public.patients FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients can read own" ON public.patients FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Patients can update own" ON public.patients FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Doctors can read assigned patients" ON public.patients FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.user_id = auth.uid() AND d.id = assigned_doctor_id));
CREATE POLICY "Authenticated can read mcqs" ON public.mcq_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage mcqs" ON public.mcq_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage assessments" ON public.assessments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients can read own assessments" ON public.assessments FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid()));
CREATE POLICY "Patients can insert own assessments" ON public.assessments FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid()));
CREATE POLICY "Admins can manage appointments" ON public.appointments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Doctors can read own appointments" ON public.appointments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.user_id = auth.uid() AND d.id = doctor_id));
CREATE POLICY "Patients can read own appointments" ON public.appointments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.patients p WHERE p.user_id = auth.uid() AND p.id = patient_id));
CREATE POLICY "Doctors can update own appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.user_id = auth.uid() AND d.id = doctor_id));
CREATE POLICY "Patients can insert appointments" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.patients p WHERE p.user_id = auth.uid() AND p.id = patient_id));
CREATE POLICY "Admins can read all chats" ON public.chat_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read own chats" ON public.chat_messages FOR SELECT TO authenticated 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Authenticated can read scoring" ON public.scoring_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage scoring" ON public.scoring_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
NOTIFY pgrst, 'reload schema';
