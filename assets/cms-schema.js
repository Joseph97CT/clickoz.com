/* Clickoz CMS structured data layer. */
(function () {
  "use strict";

  const cms = window.ClickozCMS;
  if (!cms) return;

  const ORIGIN = "https://clickoz.com";
  const path = window.location.pathname;
  const slug = path.split("/").filter(Boolean).pop() || "";
  const tool = cms.tools.find((item) => item.url === path);
  const guide = cms.guides.find((item) => item.url === path);
  const cluster = Object.values(cms.clusters || {}).find((item) => item.url === path);

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

  function faqFor(title) {
    return [
      {
        q: `Is ${title} free to use?`,
        a: `Yes. ${title} is available as a free browser tool on Clickoz.`
      },
      {
        q: `Does ${title} upload my input?`,
        a: "Text utilities run on the page and do not require an account. Diagnostic utilities only contact the resolver or public target needed for that specific check."
      },
      {
        q: `What should I do after using ${title}?`,
        a: "Use the related guide and the suggested next tool on the page to continue the workflow without starting over."
      }
    ];
  }

  function faqSchema(title, url) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqFor(title).map((item) => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.a
        }
      })),
      "url": absolute(url)
    };
  }

  if (tool) {
    addJsonLd("clickoz-tool-schema", {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": tool.title,
      "url": absolute(tool.url),
      "description": tool.description,
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript",
      "isAccessibleForFree": true,
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "publisher": { "@type": "Organization", "name": "Clickoz", "url": ORIGIN + "/" },
      "featureList": tool.features || []
    });
    addJsonLd("clickoz-tool-faq-schema", faqSchema(tool.title, tool.url));
    return;
  }

  if (guide) {
    addJsonLd("clickoz-guide-howto-schema", {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": guide.title,
      "description": guide.description,
      "url": absolute(guide.url),
      "totalTime": "PT8M",
      "supply": [
        { "@type": "HowToSupply", "name": "A real page, text, link or creator draft to improve" },
        { "@type": "HowToSupply", "name": "The related Clickoz tool" }
      ],
      "step": [
        { "@type": "HowToStep", "name": "Diagnose the problem", "text": "Read the first section and identify what is blocking the workflow." },
        { "@type": "HowToStep", "name": "Open the related tool", "text": "Use the linked Clickoz tool to test the real input instead of guessing." },
        { "@type": "HowToStep", "name": "Apply the checklist", "text": "Use the guide checklist to clean the result, verify the page and choose the next action." }
      ],
      "publisher": { "@type": "Organization", "name": "Clickoz", "url": ORIGIN + "/" }
    });
    addJsonLd("clickoz-guide-faq-schema", faqSchema(guide.title, guide.url));
    return;
  }

  if (cluster) {
    const clusterKey = Object.keys(cms.clusters).find((key) => cms.clusters[key].url === path);
    const items = cms.tools.filter((item) => item.category === clusterKey);
    addJsonLd("clickoz-cluster-schema", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": cluster.title,
      "url": absolute(cluster.url),
      "description": cluster.description,
      "isPartOf": { "@type": "WebSite", "name": "Clickoz", "url": ORIGIN + "/" },
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": items.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": absolute(item.url),
          "name": item.title
        }))
      }
    });
  }
})();
