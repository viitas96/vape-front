export interface Brand {
  id: number;
  name: string;
  active: boolean;
}

export interface BrandDTO {
  name: string;
  active?: boolean;
}
