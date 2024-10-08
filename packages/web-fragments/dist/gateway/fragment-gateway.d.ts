interface SSRFetchErrorResponse {
    response: Response;
    overrideResponse?: boolean;
}
/**
 * Configuration object for the registration of a fragment in the app's gateway worker.
 */
export interface FragmentConfig {
    /**
     * Unique Id for the fragment.
     */
    fragmentId: string;
    /**
     * Styles to apply to the fragment before it gets pierced, their purpose
     * is to style the fragment in such a way to make it look as close as possible
     * to the final pierced view (so that the piercing operation can look seamless).
     *
     * For best results they should use the following selector:
     * :not(piercing-fragment-outlet) > piercing-fragment-host[fragment-id="fragmentId"]
     */
    prePiercingClassNames: string[];
    /**
     * An array of route patterns this fragment should handle serving.
     * Pattern format must adhere to https://github.com/pillarjs/path-to-regexp#parameters syntax
     */
    routePatterns: string[];
    /**
     * The upstream URI of the fragment application.
     * This will be fetched on any request paths matching the specified `routePatterns`
     */
    upstream: string;
    /**
     * Handler/Fallback to apply when the fetch for a fragment ssr code fails.
     * It allows the gateway to serve the provided fallback response instead of an error response straight
     * from the server.
     *
     * @param req the request sent to the fragment
     * @param failedRes the failed response (with a 4xx or 5xx status) or the thrown error
     * @returns the response to use for the document's ssr
     */
    onSsrFetchError?: (req: RequestInfo, failedResOrError: Response | unknown) => SSRFetchErrorResponse | Promise<SSRFetchErrorResponse>;
}
type FragmentGatewayConfig = {
    prePiercingStyles?: string;
};
export declare class FragmentGateway {
    #private;
    private fragmentConfigs;
    private routeMap;
    constructor(config?: FragmentGatewayConfig);
    get prePiercingStyles(): string;
    /**
     * Registers a fragment in the gateway worker so that it can be integrated
     * with the gateway worker.
     *
     * @param fragmentConfig Configuration object for the fragment.
     */
    registerFragment(fragmentConfig: FragmentConfig): void;
    matchRequestToFragment(urlOrRequest: string | URL | Request): FragmentConfig | null;
}
export {};
