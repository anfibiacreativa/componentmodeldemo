import type { FragmentGateway } from "../../fragment-gateway";
export declare function getMiddleware(gateway: FragmentGateway, mode?: "production" | "development"): PagesFunction<unknown>;
