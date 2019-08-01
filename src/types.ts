export type Workup = {
  value?: number;
  unit?: string;
  reference_quantity?: number;
  items?: WorkupItem[];
  field_id?: number;
};

export type WorkupItem = {
  title?: string;
  quantity?: number;
  per_quantity?: number;
  per_quantity_ref?: string;
  unit?: string;
};

export type WorkupItemPerQuantityValueMap = {
  [per_quantity_ref: string]: number | string | boolean;
};

export type WorkupItemPerQuantityOption = {
  id: string;
  title: string;
  is_key: boolean;
};
