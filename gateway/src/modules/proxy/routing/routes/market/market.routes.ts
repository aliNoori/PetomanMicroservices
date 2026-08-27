import {
  marketOrdersRoute,
  marketCreateOrderRoute,
  marketOrderByIdRoute,
} from './orders.route';

import {
  marketProductsRoute,
  marketProductByIdRoute,
} from './products.route';

import {
  marketUserOrderRoute,
} from './users.route';

export const marketRoutes = [
  marketOrdersRoute,
  marketCreateOrderRoute,
  marketOrderByIdRoute,

  marketProductsRoute,
  marketProductByIdRoute,
   marketUserOrderRoute,
];