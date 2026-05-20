/* Clickoz CMS structured data layer. */
(function () {
  "use strict";

  const cms = window.ClickozCMS;
  if (!cms) return;

  const ORIGIN = "https://clickoz.com";
  const path = window.location.pathname;
  const tool = cms.tools.find((item) => item.url === path);
  const guide = cms.guides.find((item) => item.url === path);
  const clusterKey = Object.keys(cms.clusters || {}).find((key) => cms.clusters[key].url === path);
  const cluster = clusterKey ? cms.clusters[clusterKey] : null;

  const guideHubs = {
    "/guides/seo/": {
      name: "SEO Guides",
      description: "Search intent, snippets, internal links, content structure and technical publishing workflows.",
      categories: ["seo", "tracking"]
    },
    "/guides/writing/": {
      name: "Writing Guides",
      description: "Readability, word count, cleanup, briefs and content structure workflows.",
      categories: ["writing"]
    },
    "/guides/dev/": {
      name: "Developer Guides",
      description: "JSON, URLs, Base64, HTML entities, tokens and debugging workflows.",
      categories: ["dev"]
    },
    "/guides/creator/": {
      name: "Creator Guides",
      description: "YouTube, creator planning, descriptions, hashtags, community posts and tracking workflows.",
      categories: ["youtube", "creator", "tracking"]
    }
  };

  function absolute(url) {
    return url && url.startsWith("http") ? url : ORIGIN + (url || "/");
  }

  function addJsonLd(id, data) {
    if (!data || document.getElementById(id)) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  function organization() {
    return {
      "@type": "Organization",
      "@id": ORIGIN + "/#organization",
      "name": "Clickoz",
      "url": ORIGIN + "/",
      "logo": ORIGIN + "/assets/favicon.svg",
      "sameAs": []
    };
  }

  function website() {
    return {
      "@type": "WebSite",
      "@id": ORIGIN + "/#website",
      "name": "Clickoz",
      "url": ORIGIN + "/",
      "publisher": { "@id": ORIGIN + "/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": ORIGIN + "/tools/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };
  }

  function addBaseGraph(extra) {
    addJsonLd("clickoz-base-schema", {
      "@context": "https://schema.org",
      "@graph": [organization(), website()].concat(extra || [])
    });
  }

  function faqFor(title) {
    return [
      {
        q: `Is ${title} free to use?`,
        a: `Yes. ${title} is free to use on Clickoz.`
      },
      {
        q: `Does ${title} upload my input?`,
        a: "Most text utilities run locally in the browser. Network diagnostic tools only contact the public target needed for that specific check."
      },
      {
        q: `What should I do after using ${title}?`,
        a: "Use the related guide and the suggested next tool on the page to continue the workflow."
      }
    ];
  }

  function faqSchema(title, url) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": absolute(url) + "#faq",
      "url": absolute(url),
      "mainEntity": faqFor(title).map((item) => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.a
        }
      }))
    };
  }

  function breadcrumb(items) {
    return {
      "@type": "BreadcrumbList",
      "@id": absolute(path) + "#breadcrumb",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": absolute(item.url)
      }))
    };
  }

  function itemList(name, url, items) {
    return {
      "@type": "ItemList",
      "name": name,
      "numberOfItems": items.length,
      "itemListOrder": "https://schema.org/ItemListUnordered",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": absolute(item.url),
        "name": item.title || item.name
      })),
      "url": absolute(url)
    };
  }

  if (tool) {
    const canonical = cms.toolBySlug?.[tool.canonicalSlug] || tool;
    addBaseGraph([
      breadcrumb([
        { name: "Home", url: "/" },
        { name: "Tools", url: "/tools/" },
        { name: tool.title, url: tool.url }
      ]),
      {
        "@type": ["WebApplication", "SoftwareApplication"],
        "@id": absolute(tool.url) + "#app",
        "name": tool.title,
        "url": absolute(tool.url),
        "description": tool.description,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript",
        "softwareRequirements": "Modern web browser",
        "isAccessibleForFree": true,
        "mainEntityOfPage": absolute(tool.url),
        "isPartOf": { "@id": ORIGIN + "/#website" },
        "publisher": { "@id": ORIGIN + "/#organization" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "featureList": tool.features || [],
        "sameAs": canonical.url !== tool.url ? absolute(canonical.url) : undefined
      }
    ]);
    addJsonLd("clickoz-tool-faq-schema", faqSchema(tool.title, tool.url));
    return;
  }

  if (guide) {
    const toolRef = cms.toolBySlug?.[guide.tool];
    addBaseGraph([
      breadcrumb([
        { name: "Home", url: "/" },
        { name: "Guides", url: "/guides/" },
        { name: guide.title, url: guide.url }
      ]),
      {
        "@type": ["Article", "HowTo"],
        "@id": absolute(guide.url) + "#guide",
        "headline": guide.title,
        "name": guide.title,
        "description": guide.description,
        "url": absolute(guide.url),
        "mainEntityOfPage": absolute(guide.url),
        "isPartOf": { "@id": ORIGIN + "/#website" },
        "publisher": { "@id": ORIGIN + "/#organization" },
        "about": guide.category,
        "mentions": toolRef ? { "@id": absolute(toolRef.url) + "#app", "name": toolRef.title } : undefined,
        "totalTime": "PT8M",
        "step": [
          { "@type": "HowToStep", "name": "Diagnose the problem", "text": "Identify the specific page, text, link or dataset issue before changing anything." },
          { "@type": "HowToStep", "name": "Use the related Clickoz tool", "text": "Run the matching browser tool with real input and review the result." },
          { "@type": "HowToStep", "name": "Apply the checklist", "text": "Use the guide checklist to decide what to keep, rewrite, test or publish." }
        ]
      }
    ]);
    addJsonLd("clickoz-guide-faq-schema", faqSchema(guide.title, guide.url));
    return;
  }

  if (cluster) {
    const items = cms.tools.filter((item) => item.category === clusterKey);
    addBaseGraph([
      breadcrumb([
        { name: "Home", url: "/" },
        { name: "Tools", url: "/tools/" },
        { name: cluster.title, url: cluster.url }
      ]),
      {
        "@type": "CollectionPage",
        "@id": absolute(cluster.url) + "#collection",
        "name": cluster.title,
        "url": absolute(cluster.url),
        "description": cluster.description,
        "isPartOf": { "@id": ORIGIN + "/#website" },
        "mainEntity": itemList(cluster.title, cluster.url, items)
      }
    ]);
    return;
  }

  if (guideHubs[path]) {
    const hub = guideHubs[path];
    const items = cms.guides.filter((item) => hub.categories.includes(item.category));
    addBaseGraph([
      breadcrumb([
        { name: "Home", url: "/" },
        { name: "Guides", url: "/guides/" },
        { name: hub.name, url: path }
      ]),
      {
        "@type": "CollectionPage",
        "@id": absolute(path) + "#collection",
        "name": hub.name,
        "url": absolute(path),
        "description": hub.description,
        "isPartOf": { "@id": ORIGIN + "/#website" },
        "mainEntity": itemList(hub.name, path, items)
      }
    ]);
    return;
  }

  addBaseGraph([
    {
      "@type": "WebPage",
      "@id": absolute(path) + "#webpage",
      "url": absolute(path),
      "name": document.title || "Clickoz",
      "isPartOf": { "@id": ORIGIN + "/#website" },
      "publisher": { "@id": ORIGIN + "/#organization" }
    }
  ]);
})();
