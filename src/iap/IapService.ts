import {IapProduct, PurchaseFlowState, PurchaseResult} from './types';

/**
 * Universal In-App Purchasing Service interface.
 * UI components depend strictly on this contract rather than concrete implementations.
 * In future iterations, Amazon Vega IAP native modules can substitute MockIapService
 * without altering any UI screens.
 */
export interface IIapService {
  /**
   * Initializes the service and prepares product catalogs.
   */
  initialize(): Promise<void>;

  /**
   * Returns available products for purchase.
   */
  getProducts(): Promise<IapProduct[]>;

  /**
   * Finds a product by its unique product identifier.
   */
  getProductById(productId: string): Promise<IapProduct | undefined>;

  /**
   * Initiates a purchase flow for the specified product.
   */
  purchase(productId: string): Promise<PurchaseResult>;

  /**
   * Indicates if a purchase transaction is currently in flight.
   */
  isPurchasing(): boolean;

  /**
   * Returns current state in the purchase lifecycle state machine.
   */
  getState(): PurchaseFlowState;

  /**
   * Registers a listener for purchase lifecycle state changes.
   * Returns an unsubscribe function.
   */
  addStateListener(listener: (state: PurchaseFlowState) => void): () => void;
}
