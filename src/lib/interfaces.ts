export interface Customer {
  id: string;
  code: string;
}

export interface Measure {
  id: string;
  type: string;
  confirmed: boolean;
  value: number;
  measureDatetime: Date;
  createdAt: Date;
  imageUrl: string;
  customerId: string;
}
