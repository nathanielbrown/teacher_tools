import React, { useState, useEffect } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import { HeaderProvider } from './contexts/HeaderContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { GDPRConsent } from './components/GDPRConsent';
import { tools } from './data/tools';
import { IntlProvider, useIntl } from 'react-intl';
import { loadMessages, Locale } from './i18n';
import { useSettings } from './contexts/SettingsContext';
import { storage } from './utils/storage';

function App() {
  const [currentTool, setCurrentTool] = useState<string>(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const validTabsMap: Record<string, string> = { 'TeacherTools': 'Teacher Tools', 'StudentTools': 'Student Tools', 'ClassroomGames': 'Classroom Games' };
    
    if (pathParts[0] === 'config') return 'config';
    if (pathParts.length > 1) return pathParts[1];
    if (pathParts.length === 1 && !validTabsMap[pathParts[0]]) return pathParts[0];
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('tool')) return params.get('tool')!;
    
    return storage.getItem('teacherToolsCurrentTool') || 'home';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const validTabsMap: Record<string, string> = { 'TeacherTools': 'Teacher Tools', 'StudentTools': 'Student Tools', 'ClassroomGames': 'Classroom Games' };
    
    let tab = 'Teacher Tools';
    if (pathParts.length > 0 && validTabsMap[pathParts[0]]) {
      tab = validTabsMap[pathParts[0]];
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab')) {
        tab = params.get('tab')!;
      } else {
        tab = storage.getItem('teacherToolsActiveTab') || 'Teacher Tools';
      }
    }

    // Determine current tool to sync tab if needed
    let tempTool = 'home';
    if (pathParts.length > 1) tempTool = pathParts[1];
    else if (pathParts.length === 1 && !validTabsMap[pathParts[0]]) tempTool = pathParts[0];
    else {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tool')) tempTool = params.get('tool')!;
      else tempTool = storage.getItem('teacherToolsCurrentTool') || 'home';
    }

    if (tempTool !== 'home' && tempTool !== 'privacy' && tempTool !== 'privacy-policy') {
      const tool = tools.find(t => t.id === tempTool);
      if (tool) return tool.mainSection;
    }
    
    return tab;
  });

  useEffect(() => {
    const handlePopState = () => {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const validTabsMap: Record<string, string> = { 'TeacherTools': 'Teacher Tools', 'StudentTools': 'Student Tools', 'ClassroomGames': 'Classroom Games' };
      
      let toolParam = 'home';
      if (pathParts[0] === 'config') toolParam = 'config';
      else if (pathParts.length > 1) toolParam = pathParts[1];
      else if (pathParts.length === 1 && !validTabsMap[pathParts[0]]) toolParam = pathParts[0];
      
      let tabParam = null;
      if (pathParts.length > 0 && validTabsMap[pathParts[0]]) tabParam = validTabsMap[pathParts[0]];
      else {
        const params = new URLSearchParams(window.location.search);
        tabParam = params.get('tab');
      }
      
      setCurrentTool(toolParam);
      if (tabParam) setActiveTab(tabParam);
      
      if (toolParam !== 'home' && toolParam !== 'privacy' && toolParam !== 'privacy-policy') {
        const tool = tools.find(t => t.id === toolParam);
        if (tool) setActiveTab(tool.mainSection);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const validTabsMap: Record<string, string> = { 'TeacherTools': 'Teacher Tools', 'StudentTools': 'Student Tools', 'ClassroomGames': 'Classroom Games' };
    const validTabsReverseMap: Record<string, string> = { 'Teacher Tools': 'TeacherTools', 'Student Tools': 'StudentTools', 'Classroom Games': 'ClassroomGames' };
    
    let prevTool = 'home';
    if (pathParts.length > 1) prevTool = pathParts[1];
    else if (pathParts.length === 1 && !validTabsMap[pathParts[0]]) prevTool = pathParts[0];

    let changed = false;
    const tabPath = validTabsReverseMap[activeTab] || 'TeacherTools';

    let expectedPathname = '/';
    if (currentTool === 'privacy' || currentTool === 'privacy-policy') {
      expectedPathname = `/${currentTool}`;
    } else if (currentTool === 'config') {
      // Handle sub-routes for config
      if (window.location.pathname.startsWith('/config/')) {
        expectedPathname = window.location.pathname;
      } else {
        expectedPathname = '/config';
      }
    } else if (currentTool !== 'home') {
      expectedPathname = `/${tabPath}/${currentTool}`;
    } else {
      expectedPathname = `/${tabPath}`;
    }

    if (url.pathname !== expectedPathname) {
      url.pathname = expectedPathname;
      changed = true;
    }

    // Clean up old query params
    if (url.searchParams.has('tab')) {
      url.searchParams.delete('tab');
      changed = true;
    }
    if (url.searchParams.has('tool')) {
      url.searchParams.delete('tool');
      changed = true;
    }

    if (changed) {
      if (currentTool !== prevTool) {
        window.history.pushState({}, '', url.toString());
      } else {
        window.history.replaceState({}, '', url.toString());
      }
    }

    storage.setItem('teacherToolsCurrentTool', currentTool);
    storage.setItem('teacherToolsActiveTab', activeTab);
  }, [currentTool, activeTab]);


  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentTool('home');
  };

  const renderTool = () => {
    if (currentTool === 'home') {
      return <Dashboard onNavigate={setCurrentTool} activeTab={activeTab} />;
    }
    
    if (currentTool === 'privacy' || currentTool === 'privacy-policy') {
      return <PrivacyPolicy />;
    }

    const tool = tools.find(t => t.id === currentTool);
    if (tool && tool.component) {
      const ToolComponent = tool.component;
      return <ToolComponent />;
    }

    return <Dashboard onNavigate={setCurrentTool} activeTab={activeTab} />;
  };

  return (
    <SettingsProvider>
      <IntlWrapper currentTool={currentTool} activeTab={activeTab}>
        <HeaderProvider>
          <Layout 
            onNavigate={setCurrentTool} 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            currentTool={currentTool}
          >
            {renderTool()}
          </Layout>
          <GDPRConsent />
        </HeaderProvider>
      </IntlWrapper>

    </SettingsProvider>
  );
}

const MetadataManager = ({ currentTool, activeTab }: { currentTool: string, activeTab: string }) => {
  const intl = useIntl();

  useEffect(() => {
    let title = activeTab === 'Student Tools' 
      ? `${intl.formatMessage({ id: 'nav.student_tools', defaultMessage: 'Student Tools' })} | ClassRex`
      : `${intl.formatMessage({ id: 'nav.teacher_tools', defaultMessage: 'Teacher Tools' })} | ClassRex`;
    
    let description = 'Free online interactive tools and games for teachers and students. Perfect for classroom management, math, literacy, science, and more.';
    let canonicalPath = '';

    if (currentTool === 'privacy' || currentTool === 'privacy-policy') {
      title = `${intl.formatMessage({ id: 'privacy.title', defaultMessage: 'Privacy Policy' })} | ClassRex`;
      canonicalPath = 'privacy';
    } else if (currentTool !== 'home') {
      const tool = tools.find(t => t.id === currentTool);
      if (tool) {
        title = `${intl.formatMessage({ id: `tool.${tool.id}.name`, defaultMessage: tool.name })} | ClassRex`;
        description = tool.description;
        canonicalPath = tool.id;
      }
    }

    // Update title
    document.title = title;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', description);
      document.head.appendChild(metaDescription);
    }

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    const fullCanonicalUrl = canonicalPath ? `https://beta.classrex.com/${canonicalPath}` : 'https://beta.classrex.com/';
    
    if (canonicalLink) {
      canonicalLink.setAttribute('href', fullCanonicalUrl);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', fullCanonicalUrl);
      document.head.appendChild(canonicalLink);
    }

    // Update og:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    } else {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      ogTitle.setAttribute('content', title);
      document.head.appendChild(ogTitle);
    }

    // Update og:description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    } else {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      ogDescription.setAttribute('content', description);
      document.head.appendChild(ogDescription);
    }

    // Update og:url
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', fullCanonicalUrl);
    } else {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      ogUrl.setAttribute('content', fullCanonicalUrl);
      document.head.appendChild(ogUrl);
    }
  }, [currentTool, activeTab, intl]);

  return null;
};

const IntlWrapper = ({ children, currentTool, activeTab }: { children: React.ReactNode, currentTool: string, activeTab: string }) => {
  const { settings } = useSettings();
  const locale = (settings.language || 'en') as Locale;
  const [messages, setMessages] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    loadMessages(locale).then(setMessages);
  }, [locale]);

  if (!messages) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <IntlProvider 
      key={locale}
      locale={locale} 
      messages={messages} 
      defaultLocale="en"
    >
      <MetadataManager currentTool={currentTool} activeTab={activeTab} />
      {children}
    </IntlProvider>
  );
};


export default App;
