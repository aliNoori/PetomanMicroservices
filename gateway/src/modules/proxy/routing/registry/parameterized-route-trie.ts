import {
  GatewayRoute,
} from '../gateway-route.types';

export interface TrieMatch {
  route: GatewayRoute;
  params: Record<string, string>;
}

interface TrieNode {
  staticChildren: Map<string, TrieNode>;
  parameterChild?: TrieNode;
  parameterName?: string;
  routes: Map<string, GatewayRoute>;
}

/**
 * Trie-based matcher for parameterized Gateway routes.
 *
 * Static segments always have priority over
 * parameterized segments.
 *
 * Example:
 *
 * GET /users/:userId/orders/:orderId
 *
 * matches:
 *
 * GET /users/user-001/orders/order-100
 */
export class ParameterizedRouteTrie {
  private readonly root: TrieNode =
    this.createNode();

  /**
   * Register a parameterized route.
   */
  insert(
    route: GatewayRoute,
  ): void {
    if (!this.isParameterized(route.path)) {
      throw new Error(
        `Cannot register non-parameterized route in parameterized Trie: ` +
          `${route.method} ${route.path}`,
      );
    }

    const segments =
      this.splitPath(route.path);

    let current =
      this.root;

    for (
      const segment of segments
    ) {
      if (
        segment.startsWith(':')
      ) {
        const parameterName =
          segment.substring(1);

        if (!parameterName) {
          throw new Error(
            `Invalid empty route parameter in: ` +
              `${route.method} ${route.path}`,
          );
        }

        if (
          !current.parameterChild
        ) {
          current.parameterChild =
            this.createNode();

          current.parameterName =
            parameterName;
        } else if (
          current.parameterName !==
          parameterName
        ) {
          throw new Error(
            `Conflicting parameter names in gateway route Trie near ` +
              `"${segment}". Existing parameter: ` +
              `"${current.parameterName}", received: ` +
              `"${parameterName}".`,
          );
        }

        current =
          current.parameterChild;

        continue;
      }

      let child =
        current.staticChildren.get(
          segment,
        );

      if (!child) {
        child =
          this.createNode();

        current.staticChildren.set(
          segment,
          child,
        );
      }

      current =
        child;
    }

    const method =
      route.method.toUpperCase();

    if (
      current.routes.has(method)
    ) {
      throw new Error(
        `Duplicate parameterized gateway route: ` +
          `${method} ${route.path}`,
      );
    }

    current.routes.set(
      method,
      route,
    );
  }

  /**
   * Match an incoming request.
   *
   * Static branches are always evaluated
   * before parameter branches.
   */
  match(
    method: string,
    path: string,
  ): TrieMatch | undefined {
    const normalizedMethod =
      method.toUpperCase();

    const normalizedPath =
      this.normalizePath(path);

    const segments =
      this.splitPath(
        normalizedPath,
      );

    const params:
      Record<string, string> = {};

    return this.matchNode(
      this.root,
      segments,
      0,
      normalizedMethod,
      params,
    );
  }

  private matchNode(
    node: TrieNode,
    segments: string[],
    index: number,
    method: string,
    params: Record<string, string>,
  ): TrieMatch | undefined {
    if (
      index === segments.length
    ) {
      const route =
        node.routes.get(method);

      if (!route) {
        return undefined;
      }

      return {
        route,
        params: {
          ...params,
        },
      };
    }

    const segment =
      segments[index];

    /*
     * Static branches always have priority.
     *
     * Example:
     *
     * /users/me
     *
     * wins over:
     *
     * /users/:userId
     */
    const staticChild =
      node.staticChildren.get(
        segment,
      );

    if (staticChild) {
      const result =
        this.matchNode(
          staticChild,
          segments,
          index + 1,
          method,
          params,
        );

      if (result) {
        return result;
      }
    }

    /*
     * If the static branch does not produce
     * a valid route, try the parameter branch.
     */
    if (
      node.parameterChild &&
      node.parameterName
    ) {
      const parameterName =
        node.parameterName;

      const previousValue =
        params[parameterName];

      let decodedValue: string;

      try {
        decodedValue =
          decodeURIComponent(
            segment,
          );
      } catch {
        return undefined;
      }

      params[parameterName] =
        decodedValue;

      const result =
        this.matchNode(
          node.parameterChild,
          segments,
          index + 1,
          method,
          params,
        );

      if (result) {
        return result;
      }

      /*
       * Backtrack when the parameter branch
       * does not produce a valid route.
       */
      if (
        previousValue === undefined
      ) {
        delete params[
          parameterName
        ];
      } else {
        params[
          parameterName
        ] = previousValue;
      }
    }

    return undefined;
  }

  private createNode(): TrieNode {
    return {
      staticChildren:
        new Map<
          string,
          TrieNode
        >(),

      routes:
        new Map<
          string,
          GatewayRoute
        >(),
    };
  }

  private isParameterized(
    path: string,
  ): boolean {
    return this.splitPath(
      path,
    ).some(
      segment =>
        segment.startsWith(':'),
    );
  }

  private normalizePath(
    path: string,
  ): string {
    if (!path) {
      return '/';
    }

    const normalized =
      `/${path}`
        .replace(
          /\/+/g,
          '/',
        );

    if (
      normalized.length > 1
    ) {
      return normalized.replace(
        /\/+$/,
        '',
      );
    }

    return normalized;
  }

  private splitPath(
    path: string,
  ): string[] {
    return this.normalizePath(
      path,
    )
      .split('/')
      .filter(Boolean);
  }
}