import {
  STORAGE_KEYS,
} from "./storage.keys";


const storage = window.localStorage;


export const tokenStorage = {

  getAccessToken(): string | null {
    return storage.getItem(
      STORAGE_KEYS.ACCESS_TOKEN,
    );
  },


  setAccessToken(
    token: string,
  ): void {
    storage.setItem(
      STORAGE_KEYS.ACCESS_TOKEN,
      token,
    );
  },


  removeAccessToken(): void {
    storage.removeItem(
      STORAGE_KEYS.ACCESS_TOKEN,
    );
  },


  getRefreshToken(): string | null {
    return storage.getItem(
      STORAGE_KEYS.REFRESH_TOKEN,
    );
  },


  setRefreshToken(
    token: string,
  ): void {
    storage.setItem(
      STORAGE_KEYS.REFRESH_TOKEN,
      token,
    );
  },


  removeRefreshToken(): void {
    storage.removeItem(
      STORAGE_KEYS.REFRESH_TOKEN,
    );
  },


  clear(): void {
    storage.removeItem(
      STORAGE_KEYS.ACCESS_TOKEN,
    );

    storage.removeItem(
      STORAGE_KEYS.REFRESH_TOKEN,
    );

    storage.removeItem(
      STORAGE_KEYS.USER,
    );
  },
};