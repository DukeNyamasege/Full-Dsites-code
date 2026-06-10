export type RuntimeSiteConfig = {
    site: {
        id: string;
        name: string;
        hostname: string;
    };
    branding: {
        brandName: string;
        logoUrl?: string;
        faviconUrl?: string;
        theme: {
            primaryColor?: string;
            secondaryColor?: string;
            accentColor?: string;
            headerBgColor?: string;
            headerTextColor?: string;
        };
        customCssVars?: Record<string, string>;
    };
    deriv: {
        oauthClientId?: string;
        appId?: string;
        redirectUri?: string;
        useLegacyOAuthLogin?: boolean;
        includeLegacyAppIdInOAuth?: boolean;
    };
    features: {
        botIdeas?: boolean;
        printPopups?: boolean;
        autoTrades?: boolean;
        manualTrading?: boolean;
        scanner?: boolean;
        chart?: boolean;
        bestBots?: boolean;
        copyTrading?: boolean;
        percentageTool?: boolean;
    };
    pages: Array<{
        key: string;
        label?: string;
        enabled: boolean;
        order: number;
    }>;
    bots: Array<{
        id?: string;
        name: string;
        filePath?: string;
        displayOrder?: number;
        isActive?: boolean;
    }>;
};
