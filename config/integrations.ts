/**
 * Toggle third-party integrations on/off.
 * Re-enable individually when ready for production.
 */
export const integrations = {
    gtm: false,
    oneTrust: false,
    hubspot: false,
} as const;

export const isGtmEnabled = () => integrations.gtm && Boolean(process.env.NUXT_PUBLIC_GTM_ID || process.env.GATSBY_GTM_ID);

export const isOneTrustEnabled = () =>
    integrations.oneTrust &&
    Boolean(process.env.NUXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT || process.env.GATSBY_ONETRUST_DOMAIN_SCRIPT);

export const isHubSpotEnabled = () =>
    integrations.hubspot &&
    Boolean(process.env.NUXT_PUBLIC_HUBSPOT_PORTAL_ID || process.env.GATSBY_HUBSPOT_PORTAL_ID);
