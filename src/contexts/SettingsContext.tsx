import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ta';
type Theme = 'light' | 'dark';

interface Translations {
  [key: string]: {
    en: string;
    ta: string;
  };
}

export const translations: Translations = {
  // Navbar
  'app.name': { en: 'Clean Madurai', ta: 'தூய்மையான மதுரை' },
  'nav.home': { en: 'Home', ta: 'முகப்பு' },
  'nav.dashboard': { en: 'Dashboard', ta: 'பலகை' },
  'nav.reports': { en: 'My Reports', ta: 'எனது புகார்கள்' },
  'nav.map': { en: 'Smart Map', ta: 'வரைபடம்' },
  'nav.community': { en: 'Community', ta: 'சமூகம்' },
  'nav.awareness': { en: 'Awareness', ta: 'விழிப்புணர்வு' },
  'nav.ward_overview': { en: 'Ward Overview', ta: 'வார்டு கண்ணோட்டம்' },
  'nav.manage_reports': { en: 'Manage Reports', ta: 'புகார்களை நிர்வகி' },
  'nav.ward_analytics': { en: 'Ward Analytics', ta: 'வார்டு பகுப்பாய்வு' },
  'nav.login': { en: 'Login', ta: 'உள்நுழை' },
  'nav.logout': { en: 'Logout', ta: 'வெளியேறு' },
  
  // Hero
  'hero.title': { en: 'Clean Madurai', ta: 'தூய்மையான மதுரை' },
  'hero.subtitle': { en: 'Empowering citizens and officers to build a cleaner, smarter, and more vibrant Madurai.', ta: 'தூய்மையான, சிறந்த மற்றும் துடிப்பான மதுரையை உருவாக்க குடிமக்களையும் அதிகாரிகளையும் மேம்படுத்துதல்.' },
  'hero.cta': { en: 'Report an Issue Now', ta: 'இப்போதே புகாரளிக்கவும்' },

  // Features
  'feature.smart_reporting': { en: 'Smart Reporting', ta: 'ஸ்மார்ட் புகார்' },
  'feature.smart_reporting_desc': { en: 'Report civic issues like waste, water leaks, or road damage instantly with GPS location and photos.', ta: 'குப்பை, நீர் கசிவு அல்லது சாலை சேதம் போன்ற சிக்கல்களை ஜிபிஎஸ் மற்றும் புகைப்படங்களுடன் உடனடியாக புகாரளிக்கவும்.' },
  'feature.officer_portal': { en: 'Officer Portal', ta: 'அதிகாரி தளம்' },
  'feature.officer_portal_desc': { en: 'Dedicated tools for ward officers to track, manage, and resolve issues efficiently with real-time analytics.', ta: 'வார்டு அதிகாரிகளுக்கான பிரத்யேக கருவிகள், புகார்களை கண்காணிக்கவும் தீர்க்கவும்.' },

  // Places
  'places.title': { en: 'Discover Madurai', ta: 'மதுரையை அறிவோம்' },
  'places.subtitle': { en: 'The Athens of the East and the cultural capital of Tamil Nadu.', ta: 'கிழக்கின் ஏதென்ஸ் மற்றும் தமிழ்நாட்டின் கலாச்சார தலைநகரம்.' },

  // Auth
  'auth.login_title': { en: 'Welcome Back', ta: 'மீண்டும் வருக' },
  'auth.register_title': { en: 'Join the Movement', ta: 'இயக்கத்தில் இணையுங்கள்' },
  'auth.email': { en: 'Email Address', ta: 'மின்னஞ்சல் முகவரி' },
  'auth.password': { en: 'Password', ta: 'கடவுச்சொல்' },
  'auth.name': { en: 'Full Name', ta: 'முழு பெயர்' },
  'auth.ward': { en: 'My Ward', ta: 'எனது வார்டு' },
  'auth.submit_login': { en: 'Login', ta: 'உள்நுழை' },
  'auth.submit_register': { en: 'Create Account', ta: 'கணக்கை உருவாக்கு' },
  'auth.switch_register': { en: "Don't have an account? Register", ta: "கணக்கு இல்லையா? பதிவு செய்க" },
  'auth.switch_login': { en: "Already have an account? Login", ta: "ஏற்கனவே கணக்கு உள்ளதா? உள்நுழை" },

  // Dashboard
  'dash.welcome': { en: 'Welcome back', ta: 'நல்வரவு' },
  'dash.stat.total': { en: 'Total Reports', ta: 'மொத்த புகார்கள்' },
  'dash.stat.resolved': { en: 'Resolved', ta: 'தீர்க்கப்பட்டது' },
  'dash.stat.pending': { en: 'Pending', ta: 'நிலுவையில்' },
  'dash.recent': { en: 'Recent Activity', ta: 'சமீபத்திய செயல்பாடுகள்' },

  // Report Form
  'report.title': { en: 'New Report', ta: 'புதிய புகார்' },
  'report.category': { en: 'Category', ta: 'வகை' },
  'report.desc': { en: 'Description', ta: 'விளக்கம்' },
  'report.urgency': { en: 'Urgency', ta: 'அவசரம்' },
  'report.location': { en: 'Location', ta: 'இடம்' },
  'report.submit': { en: 'Submit Report', ta: 'புகாரை சமர்ப்பி' },
  'report.detecting': { en: 'Detecting location...', ta: 'இடத்தை கண்டறிகிறது...' },

  // Common
  'common.loading': { en: 'Loading...', ta: 'ஏற்றுகிறது...' },
  'common.error': { en: 'Error', ta: 'பிழை' },
  'common.success': { en: 'Success', ta: 'வெற்றி' },
};

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Check system preference for theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <SettingsContext.Provider value={{ language, setLanguage, theme, toggleTheme, t }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
