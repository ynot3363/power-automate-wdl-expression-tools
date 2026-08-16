import { WdlFunctionCatalog } from "./catalog";
import { initialFunctionDefinitions } from "./initialFunctionDefinitions";

export const wdlFunctionCatalog = new WdlFunctionCatalog(
  initialFunctionDefinitions,
);
