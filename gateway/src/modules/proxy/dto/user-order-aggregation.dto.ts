export interface AggregatedOrderDto {
  id: string;
  status: string;
  total: number;
}

export interface AggregatedUserDto {
  id: string;
  email: string;
  roles: string[];
  orders: AggregatedOrderDto[];
}

export interface UserOrderAggregationDto {
  user: AggregatedUserDto;
}