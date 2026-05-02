import React, { useEffect } from 'react';
import { ShieldCheck, Database, Cookie, CloudOff } from 'lucide-react';
import { useHeader } from '../contexts/HeaderContext';
import { FormattedMessage, useIntl } from 'react-intl';

export const PrivacyPolicy = () => {
  const { clearHeader } = useHeader();
  const intl = useIntl();
  
  useEffect(() => {
    clearHeader();
  }, [clearHeader]);

  return (
    <div className="w-full h-full p-4 md:p-8 max-w-4xl mx-auto font-['Outfit'] flex flex-col gap-8 text-slate-700 overflow-y-auto custom-scrollbar pb-24">
      <div className="space-y-4">
        <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight flex items-center gap-4">
          <ShieldCheck size={48} className="text-indigo-500" />
          <FormattedMessage id="privacy.title" defaultMessage="Privacy Policy" />
        </h1>
        <p className="text-slate-500 font-medium text-lg ml-1">
          <FormattedMessage 
            id="privacy.lastUpdated" 
            defaultMessage="Last updated: {date}" 
            values={{ date: intl.formatDate(new Date('2024-05-20'), { month: 'long', year: 'numeric' }) }}
          />
        </p>
      </div>

      <div className="glass-card p-8 md:p-12 rounded-[2.5rem] space-y-12 shadow-xl border-4 border-white">
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <Database className="text-blue-500" />
            <FormattedMessage id="privacy.section1.title" defaultMessage="1. Data Storage & Local Processing" />
          </h2>
          <p className="leading-relaxed font-medium">
            <FormattedMessage 
              id="privacy.section1.desc1" 
              defaultMessage="ClassRex is designed with a 'Privacy First' and 'Local First' architecture. All data you enter into the application (such as student names, custom word lists, class schedules, and settings) is stored <b>locally on your device</b> using your browser's Local Storage."
              values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
            />
          </p>
          <p className="leading-relaxed font-medium">
            <FormattedMessage id="privacy.section1.desc2" defaultMessage="We do not have access to this data, nor is it ever transmitted to our servers or any third-party databases. You have complete ownership and control over your classroom data." />
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <CloudOff className="text-rose-500" />
            <FormattedMessage id="privacy.section2.title" defaultMessage="2. Cloud Services & Analytics" />
          </h2>
          <p className="leading-relaxed font-medium">
            <FormattedMessage id="privacy.section2.desc1" defaultMessage="ClassRex does not use cloud databases for storing user-generated content. We do not use invasive tracking pixels. The application is served statically, meaning it can function entirely offline once loaded." />
          </p>
          <p className="leading-relaxed font-medium">
            <FormattedMessage id="privacy.section2.desc2" defaultMessage="As with most website hosting services, standard server logs are maintained by our hosting provider. These logs may include IP addresses, browser types, and access times for security and maintenance purposes, but they are not linked to your classroom data." />
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <Cookie className="text-amber-500" />
            <FormattedMessage id="privacy.section3.title" defaultMessage="3. Cookies and Tracking" />
          </h2>
          <p className="leading-relaxed font-medium">
            <FormattedMessage 
              id="privacy.section3.desc" 
              defaultMessage="<b>No cookies are used at all</b> on ClassRex. We do not use advertising cookies, third-party trackers, or cross-site tracking scripts. Browser local storage is used strictly to save your settings and classroom data on your own device."
              values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
            />
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <ShieldCheck className="text-emerald-500" />
            <FormattedMessage id="privacy.section4.title" defaultMessage="4. Regulatory Compliance (COPPA, GDPR, FERPA, APPs)" />
          </h2>
          <p className="leading-relaxed font-medium">
            <FormattedMessage id="privacy.section4.desc" defaultMessage="ClassRex is an educational tool designed for teachers to use in the classroom. Because all data is stored locally on the teacher's device and no personal information is transmitted to our servers, ClassRex inherently complies with:" />
          </p>
          <ul className="list-disc ml-6 space-y-2 font-medium">
            <li>
              <FormattedMessage 
                id="privacy.section4.coppa" 
                defaultMessage="<b>COPPA:</b> We do not collect personal information from children under 13."
                values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
              />
            </li>
            <li>
              <FormattedMessage 
                id="privacy.section4.gdpr" 
                defaultMessage="<b>GDPR:</b> We act as a 'Zero-Knowledge' provider; you remain the sole controller of your data."
                values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
              />
            </li>
            <li>
              <FormattedMessage 
                id="privacy.section4.ferpa" 
                defaultMessage="<b>FERPA:</b> Student records remain within the school's control on the teacher's device."
                values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
              />
            </li>
            <li>
              <FormattedMessage 
                id="privacy.section4.apps" 
                defaultMessage="<b>Australian Privacy Principles (APPs):</b> We satisfy the 13 APPs under the <em>Privacy Act 1988 (Cth)</em>, particularly regarding anonymity (APP 2) and data security (APP 11)."
                values={{ 
                  b: (chunks: React.ReactNode) => <b>{chunks}</b>,
                  em: (chunks: React.ReactNode) => <em>{chunks}</em>
                }}
              />
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <Database className="text-indigo-500" />
            <FormattedMessage id="privacy.section5.title" defaultMessage="5. Your Rights (Access, Portability, Erasure)" />
          </h2>
          <p className="leading-relaxed font-medium">
            <FormattedMessage id="privacy.section5.desc" defaultMessage="Under global privacy regulations, you have the following rights, which ClassRex facilitates through its 'Configuration' tool:" />
          </p>
          <ul className="list-disc ml-6 space-y-2 font-medium">
            <li>
              <FormattedMessage 
                id="privacy.section5.access" 
                defaultMessage="<b>Right to Access & Portability:</b> You can download a complete copy of all your data at any time via the 'Export Backup' feature."
                values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
              />
            </li>
            <li>
              <FormattedMessage 
                id="privacy.section5.erasure" 
                defaultMessage="<b>Right to Erasure (The 'Right to be Forgotten'):</b> You can permanently delete all data stored by ClassRex using the 'Clear Database' button in the settings."
                values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
              />
            </li>
            <li>
              <FormattedMessage 
                id="privacy.section5.rectification" 
                defaultMessage="<b>Right to Rectification:</b> You can directly edit or update any information (such as class lists or words) within the application."
                values={{ b: (chunks: React.ReactNode) => <b>{chunks}</b> }}
              />
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            <FormattedMessage id="privacy.section6.title" defaultMessage="6. Changes to this Policy" />
          </h2>
          <p className="leading-relaxed font-medium">
            <FormattedMessage id="privacy.section6.desc" defaultMessage="We may update this Privacy Policy from time to time. Any changes will be reflected on this page. Because we do not collect your email address or contact information, we cannot notify you directly of changes; please review this page periodically." />
          </p>
        </section>

        <section className="space-y-4 pt-8 border-t-2 border-slate-100">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            <FormattedMessage id="privacy.contact.title" defaultMessage="Contact" />
          </h2>
          <p className="leading-relaxed font-medium">
            <FormattedMessage id="privacy.contact.desc" defaultMessage="If you have any questions about this Privacy Policy or how ClassRex handles data, please reach out to us via our Patreon page." />
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
