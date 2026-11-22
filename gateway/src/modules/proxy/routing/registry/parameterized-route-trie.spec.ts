import { GatewayRoute } from '../gateway-route.types';
import { ParameterizedRouteTrie } from './parameterized-route-trie';

describe('ParameterizedRouteTrie', () => {
  let trie: ParameterizedRouteTrie;

  const createRoute = (method: string, path: string): GatewayRoute =>
    ({
      method,
      path,
    }) as GatewayRoute;

  beforeEach(() => {
    trie = new ParameterizedRouteTrie();
  });

  it('should match a parameterized route and extract its parameters', () => {
    const route = createRoute(
      'GET',
      '/api/market/public/stores/:storeSlug/products',
    );

    trie.insert(route);

    const result = trie.match(
      'GET',
      '/api/market/public/stores/petoman-store/products',
    );

    expect(result).toEqual({
      route,
      params: {
        storeSlug: 'petoman-store',
      },
    });
  });

  it('should match routes case-insensitively by HTTP method', () => {
    const route = createRoute('GET', '/users/:userId');

    trie.insert(route);

    expect(trie.match('get', '/users/user-001')).toEqual({
      route,
      params: {
        userId: 'user-001',
      },
    });
  });

  it('should decode URL-encoded parameter values', () => {
    const route = createRoute('GET', '/stores/:storeSlug');

    trie.insert(route);

    const result = trie.match('GET', '/stores/my%20store');

    expect(result?.params).toEqual({
      storeSlug: 'my store',
    });
  });

  it('should normalize repeated and trailing slashes', () => {
    const route = createRoute('GET', '/users/:userId/orders');

    trie.insert(route);

    const result = trie.match('GET', '//users//user-001//orders//');

    expect(result).toEqual({
      route,
      params: {
        userId: 'user-001',
      },
    });
  });

  it('should prioritize static branches over parameterized branches', () => {
    const parameterizedRoute = createRoute('GET', '/users/:userId/orders');

    const staticPrefixRoute = createRoute('GET', '/users/me/:orderId');

    trie.insert(parameterizedRoute);
    trie.insert(staticPrefixRoute);

    const result = trie.match('GET', '/users/me/orders');

    expect(result?.route).toBe(staticPrefixRoute);
    expect(result?.params).toEqual({
      orderId: 'orders',
    });
  });

  it('should fall back to a parameterized branch when static matching fails', () => {
    const parameterizedRoute = createRoute('GET', '/users/:userId');

    const staticBranchRoute = createRoute('GET', '/users/me/orders');

    trie.insert(parameterizedRoute);

    const result = trie.match('GET', '/users/user-001');

    expect(result?.route).toBe(parameterizedRoute);
    expect(result?.params).toEqual({
      userId: 'user-001',
    });

    expect(staticBranchRoute.path).toBe('/users/me/orders');
  });

  it('should not match a route with a different HTTP method', () => {
    trie.insert(createRoute('GET', '/users/:userId'));

    expect(trie.match('POST', '/users/user-001')).toBeUndefined();
  });

  it('should not match a route with a different number of segments', () => {
    trie.insert(createRoute('GET', '/users/:userId'));

    expect(trie.match('GET', '/users/user-001/orders')).toBeUndefined();
  });

  it('should reject inserting a non-parameterized route', () => {
    expect(() => {
      trie.insert(createRoute('GET', '/users'));
    }).toThrow(
      'Cannot register non-parameterized route in parameterized Trie: GET /users',
    );
  });

  it('should reject an empty route parameter name', () => {
    expect(() => {
      trie.insert(createRoute('GET', '/users/:'));
    }).toThrow('Invalid empty route parameter in: GET /users/:');
  });

  it('should reject duplicate routes with the same method and path', () => {
    trie.insert(createRoute('GET', '/users/:userId'));

    expect(() => {
      trie.insert(createRoute('GET', '/users/:userId'));
    }).toThrow('Duplicate parameterized gateway route: GET /users/:userId');
  });

  it('should allow the same route path with different HTTP methods', () => {
    const getRoute = createRoute('GET', '/users/:userId');

    const deleteRoute = createRoute('DELETE', '/users/:userId');

    trie.insert(getRoute);
    trie.insert(deleteRoute);

    expect(trie.match('GET', '/users/user-001')?.route).toBe(getRoute);

    expect(trie.match('DELETE', '/users/user-001')?.route).toBe(deleteRoute);
  });

  it('should reject malformed URL-encoded parameter values', () => {
    trie.insert(createRoute('GET', '/stores/:storeSlug'));

    expect(trie.match('GET', '/stores/%E0%A4%A')).toBeUndefined();
  });
});
