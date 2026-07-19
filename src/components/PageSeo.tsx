import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { alternates, matchRoute } from '@/i18n/routes';

const SITE = 'https://workworld.lovable.app';

interface PageSeoProps {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noIndex?: boolean;
}

const PageSeo = ({ title, description, image, type = 'website', jsonLd, noIndex }: PageSeoProps) => {
  const { pathname } = useLocation();
  const matched = matchRoute(pathname);
  const canonical = `${SITE}${pathname}`;

  const alts = matched ? alternates(matched.key, matched.params) : null;
  const fullTitle = title.length > 60 ? title.slice(0, 57) + '…' : title;
  const desc = description && description.length > 160 ? description.slice(0, 157) + '…' : description;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {desc && <meta name="description" content={desc} />}
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      {desc && <meta property="og:description" content={desc} />}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      {desc && <meta name="twitter:description" content={desc} />}
      {image && <meta name="twitter:image" content={image} />}

      {alts && (
        <>
          <link rel="alternate" hrefLang="en" href={`${SITE}${alts.en}`} />
          <link rel="alternate" hrefLang="tr" href={`${SITE}${alts.tr}`} />
          <link rel="alternate" hrefLang="de" href={`${SITE}${alts.de}`} />
          <link rel="alternate" hrefLang="x-default" href={`${SITE}${alts.en}`} />
        </>
      )}

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default PageSeo;
