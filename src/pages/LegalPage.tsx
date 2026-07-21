import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';
import HrefLangTags from '@/components/HrefLangTags';
import { matchRoute, type RouteKey } from '@/i18n/routes';
import { useLanguage } from '@/i18n/LanguageContext';

type LegalKey = 'kvkk' | 'cookies' | 'consent' | 'terms';
type Lang = 'en' | 'tr' | 'de';

const content: Record<LegalKey, Record<Lang, { title: string; body: string }>> = {
  kvkk: {
    tr: {
      title: 'Gizlilik & KVKK Aydınlatma Metni',
      body: `WorkWorldMap ("Platform") olarak 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hareket ederiz.\n\nToplanan Veriler\n• Hesap: ad-soyad, e-posta, avatar\n• Profil: konum, biyografi, sosyal hesap bağlantıları\n• Etkileşim: yorumlar, gönderiler, katılım/oylama kayıtları\n• Teknik: IP adresi, tarayıcı bilgisi, çerezler\n\nİşleme Amacı\n• Topluluk üyeliği ve iletişim\n• Etkinlik ve şehir temsilciliği süreçlerinin yürütülmesi\n• İçerik moderasyonu ve güvenlik\n\nHaklarınız\nKVKK madde 11 kapsamında verilerinize erişme, düzeltme, silme ve işlenmesine itiraz etme haklarına sahipsiniz. Başvurularınızı destek@workworldmap.org adresine iletebilirsiniz.\n\nSaklama Süresi\nVeriler, üyelik aktif olduğu sürece ve yasal saklama süreleri boyunca güvenli ortamlarda tutulur.`,
    },
    en: {
      title: 'Privacy & Data Protection',
      body: `WorkWorldMap ("the Platform") acts as data controller for personal data processed via the service.\n\nData Collected\n• Account: name, email, avatar\n• Profile: location, biography, social handles\n• Interaction: comments, posts, RSVP and voting records\n• Technical: IP address, browser info, cookies\n\nPurpose\n• Community membership and communication\n• Running events and city representative processes\n• Content moderation and security\n\nYour Rights\nUnder applicable law (GDPR / KVKK Art. 11) you may access, correct, delete or object to the processing of your data. Contact us at support@workworldmap.org.\n\nRetention\nData is kept while your membership is active and for statutory retention periods thereafter.`,
    },
    de: {
      title: 'Datenschutzerklärung',
      body: `WorkWorldMap ist Verantwortlicher im Sinne der DSGVO für die über den Dienst verarbeiteten personenbezogenen Daten.\n\nErhobene Daten\n• Konto: Name, E-Mail, Avatar\n• Profil: Standort, Biografie, Social-Media-Handles\n• Interaktion: Kommentare, Beiträge, Teilnahme-/Abstimmungsdaten\n• Technik: IP-Adresse, Browserinformationen, Cookies\n\nZweck\n• Community-Mitgliedschaft und Kommunikation\n• Durchführung von Events und Stadtvertretungen\n• Moderation und Sicherheit\n\nIhre Rechte\nSie haben das Recht auf Auskunft, Berichtigung, Löschung und Widerspruch. Kontakt: support@workworldmap.org.`,
    },
  },
  cookies: {
    tr: {
      title: 'Çerez Politikası',
      body: `Bu site, kullanıcı deneyimini iyileştirmek için çerezler kullanır.\n\nZorunlu Çerezler\nOturum yönetimi, dil tercihi ve güvenlik için gereklidir. Devre dışı bırakılamaz.\n\nİşlevsel Çerezler\nTema (açık/koyu), dil seçimi gibi tercihlerinizi hatırlar.\n\nAnalitik Çerezler\nAnonim kullanım verileri toplamak için (sayfa görüntüleme, oturum süresi) kullanılır. Reddedilebilir.\n\nÜçüncü Taraf\n• OpenStreetMap kutucukları\n• YouTube/Spotify medya gömme çerçeveleri\n\nTarayıcı ayarlarından çerezleri yönetebilirsiniz.`,
    },
    en: {
      title: 'Cookie Policy',
      body: `This site uses cookies to improve your experience.\n\nStrictly Necessary\nSession, language and security cookies — cannot be disabled.\n\nFunctional\nRemember preferences like theme (light/dark) and language.\n\nAnalytics\nCollect anonymous usage statistics (page views, session length). Can be declined.\n\nThird Party\n• OpenStreetMap tiles\n• YouTube / Spotify embed frames\n\nYou can manage cookies from your browser settings.`,
    },
    de: {
      title: 'Cookie-Richtlinie',
      body: `Wir verwenden Cookies zur Verbesserung des Nutzererlebnisses.\n\nErforderlich\nSitzungs-, Sprach- und Sicherheits-Cookies — nicht deaktivierbar.\n\nFunktional\nSpeichern Präferenzen wie Theme und Sprache.\n\nAnalyse\nAnonyme Nutzungsstatistiken (Seitenaufrufe, Sitzungsdauer). Ablehnbar.\n\nDrittanbieter\n• OpenStreetMap-Kacheln\n• YouTube-/Spotify-Einbettungen`,
    },
  },
  consent: {
    tr: {
      title: 'Açık Rıza Formu',
      body: `WorkWorldMap üyeliği ve içerik gönderimi ile aşağıdaki hususlara açık rızanızı vermiş olursunuz:\n\n• Ad, e-posta ve profil bilgilerinizin toplanması ve saklanması\n• Gönderdiğiniz içeriklerin (yazı, yorum, etkinlik, şehir verisi) topluluk moderasyonundan sonra kamuya açık şekilde yayımlanması\n• Şehir temsilciliği başvurunuz için profil bilgilerinizin yöneticilerle paylaşılması\n• İletişim, bildirim ve bilgilendirme e-postalarının tarafınıza gönderilmesi\n\nRıza istediğiniz zaman panelden hesap silme yoluyla geri çekilebilir; geri çekme, önceki işlemlerin hukuka uygunluğunu etkilemez.`,
    },
    en: {
      title: 'Explicit Consent',
      body: `By joining WorkWorldMap and submitting content you explicitly consent to:\n\n• Collection and storage of your name, email and profile information\n• Public display of content you submit (posts, comments, events, city data) after community moderation\n• Sharing of your profile with administrators when you apply for a city representative seat\n• Receiving notification and update emails\n\nYou may withdraw consent at any time by deleting your account from your dashboard. Withdrawal does not affect the lawfulness of prior processing.`,
    },
    de: {
      title: 'Einwilligungserklärung',
      body: `Mit der Nutzung von WorkWorldMap und der Einreichung von Inhalten willigen Sie ausdrücklich ein in:\n\n• Erhebung und Speicherung Ihres Namens, Ihrer E-Mail und Profildaten\n• Veröffentlichung eingereichter Inhalte nach Moderation\n• Weitergabe Ihres Profils an Administratoren bei Bewerbung als Stadtvertreter:in\n• Erhalt von Benachrichtigungs-E-Mails\n\nDie Einwilligung kann jederzeit im Dashboard widerrufen werden.`,
    },
  },
  terms: {
    tr: {
      title: 'Kullanıcı Sözleşmesi',
      body: `Bu sözleşme, WorkWorldMap ("Platform") kullanımınıza ilişkin şartları düzenler. Kayıt olmakla bu şartları kabul etmiş sayılırsınız.\n\n1. Hizmet\nPlatform, açık kaynak, kâr amacı gütmeyen bir topluluk aracıdır. İçerik moderasyondan geçer, garanti veya SLA sunulmaz.\n\n2. Kullanıcı Yükümlülükleri\n• Doğru ve güncel bilgi sağlamak\n• Yasa dışı, aşağılayıcı, telif ihlali içeren veya spam içerik yayımlamamak\n• Başka kullanıcıların verilerini kötüye kullanmamak\n\n3. İçerik Lisansı\nPaylaştığınız içerik size aittir; Platform, içeriği sergilemek amacıyla dünya çapında, ücretsiz, geri alınabilir bir lisansa sahiptir. Hesap silinirse içerik anonim hale getirilir.\n\n4. Fesih\nKurallara aykırı davranışta hesabınız uyarısız askıya alınabilir.\n\n5. Sorumluluk\nPlatform "olduğu gibi" sunulur. Dolaylı zararlardan sorumlu değildir.\n\n6. Değişiklikler\nBu şartlar önceden bildirimle güncellenebilir. Değişiklik sonrası kullanım, kabul anlamına gelir.`,
    },
    en: {
      title: 'Terms of Service',
      body: `These terms govern your use of WorkWorldMap ("the Platform"). By registering you accept them.\n\n1. Service\nAn open-source, non-profit community tool. Content is moderated; no warranty or SLA is provided.\n\n2. User Obligations\n• Provide accurate and up-to-date information\n• No unlawful, defamatory, infringing or spam content\n• No misuse of other users' data\n\n3. Content License\nContent you submit remains yours; you grant the Platform a worldwide, royalty-free, revocable license to display it. On account deletion, content is anonymised.\n\n4. Termination\nAccounts violating the rules may be suspended without notice.\n\n5. Liability\nProvided "as is". We are not liable for indirect damages.\n\n6. Changes\nTerms may be updated with prior notice; continued use constitutes acceptance.`,
    },
    de: {
      title: 'Nutzungsbedingungen',
      body: `Diese Bedingungen regeln die Nutzung von WorkWorldMap. Mit der Registrierung akzeptieren Sie sie.\n\n1. Dienst\nOpen-Source, gemeinnützige Community-Plattform. Inhalte werden moderiert; keine Garantie oder SLA.\n\n2. Pflichten\n• Wahrheitsgemäße Angaben\n• Keine rechtswidrigen, beleidigenden oder Spam-Inhalte\n• Keine missbräuchliche Nutzung von Nutzerdaten\n\n3. Inhaltslizenz\nEingereichte Inhalte bleiben Ihr Eigentum; Sie gewähren dem Dienst eine weltweite, unentgeltliche, widerrufliche Lizenz zur Darstellung.\n\n4. Kündigung\nBei Regelverstoß kann das Konto ohne Vorankündigung gesperrt werden.\n\n5. Haftung\nBereitstellung "wie besehen". Keine Haftung für Folgeschäden.\n\n6. Änderungen\nBedingungen können mit Vorankündigung aktualisiert werden.`,
    },
  },
};

const LegalPage = () => {
  const location = useLocation();
  const { lang } = useLanguage();
  const matched = matchRoute(location.pathname);
  const key = matched?.key as LegalKey | undefined;
  const page = key && content[key] ? content[key][lang] || content[key].en : null;

  if (!page || !key) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HrefLangTags routeKey={key as RouteKey} />
      <main className="max-w-2xl mx-auto px-4 py-16 flex-1">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-6">{page.title}</h1>
        <div className="prose prose-gray max-w-none">
          {page.body.split('\n').map((line, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed mb-3 whitespace-pre-wrap">{line}</p>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-10">
          Last updated: {new Date().toLocaleDateString(lang === 'tr' ? 'tr-TR' : lang === 'de' ? 'de-DE' : 'en-US')}
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default LegalPage;
