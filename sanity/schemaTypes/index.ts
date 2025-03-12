import { promotionCampaign } from "./schemas/promotionCampaign";
import { type SchemaTypeDefinition } from "sanity";
import { product } from "./schemas/product";
import { productCategory } from "./schemas/productCategory";
import { promotionCode } from "./schemas/promotionCode";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product, productCategory, promotionCampaign, promotionCode],
};
