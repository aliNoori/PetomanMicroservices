/**
 * Capability requirement definition.
 *
 * Navigation items can optionally declare
 * required access capabilities.
 *
 * The authorization layer will decide
 * whether the current user can see the item.
 */
export interface NavigationAccess {

  requiredCapability?: string;

}



/**
 * Navigation item definition.
 *
 * Represents a single navigable resource.
 */
export interface NavigationItem
  extends NavigationAccess {


  /**
   * Unique navigation identifier.
   */
  id: string;



  /**
   * Display label.
   */
  label: string;



  /**
   * Route path.
   */
  path: string;



  /**
   * Optional icon identifier.
   */
  icon?: string;

}



/**
 * Navigation group definition.
 *
 * Groups allow organizing navigation items
 * into meaningful sections.
 */
export interface NavigationGroup {


  /**
   * Unique group identifier.
   */
  id: string;



  /**
   * Group display label.
   */
  label: string;



  /**
   * Items inside this group.
   */
  items: NavigationItem[];

}