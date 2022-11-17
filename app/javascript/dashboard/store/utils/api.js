import fromUnixTime from 'date-fns/fromUnixTime';
import differenceInDays from 'date-fns/differenceInDays';
import Cookies from 'js-cookie';
import {
  ANALYTICS_IDENTITY,
  ANALYTICS_RESET,
  CHATWOOT_RESET,
  CHATWOOT_SET_USER,
} from '../../helper/scriptHelpers';
import { LocalStorage, LOCAL_STORAGE_KEYS } from '../../helper/localStorage';

/* TODO: JSFIX could not patch the breaking change:
Removed defaults in favor of a builder: now to supply an api instance with particular predefined (cookie) attributes there's Cookies.withAttributes() 
Suggested fix: To declare default properties for each cookie you now have to create your own api instance. 
By this we simply mean that instead of using Cookie.set()/get() you would use your own cookie api object, for which these default properties were already defined.
You can define this api instance of Cookie with default properties by using `Cookies.withAttributes()`:
  const api = Cookies.withAttributes({
    // default properties, for instance -
    // secure: true
  })
The big complication this brings is that each place in your code where you are using the default properties, you will now have to use this new api instance instead of the default Cookie object.
For another example of this, see the official changelog: https://github.com/js-cookie/js-cookie/releases/tag/v3.0.0 */
Cookies.defaults = { sameSite: 'Lax' };

export const getLoadingStatus = state => state.fetchAPIloadingStatus;
export const setLoadingStatus = (state, status) => {
  state.fetchAPIloadingStatus = status;
};

export const setUser = user => {
  window.bus.$emit(CHATWOOT_SET_USER, { user });
  window.bus.$emit(ANALYTICS_IDENTITY, { user });
};

export const getHeaderExpiry = response =>
  fromUnixTime(response.headers.expiry);

export const setAuthCredentials = response => {
  const expiryDate = getHeaderExpiry(response);
  Cookies.set('cw_d_session_info', JSON.stringify(response.headers), {
    expires: differenceInDays(expiryDate, new Date()),
  });
  setUser(response.data.data, expiryDate);
};

export const clearBrowserSessionCookies = () => {
  Cookies.remove('cw_d_session_info');
  Cookies.remove('auth_data');
  Cookies.remove('user');
};

export const clearLocalStorageOnLogout = () => {
  LocalStorage.remove(LOCAL_STORAGE_KEYS.DRAFT_MESSAGES);
};

export const clearCookiesOnLogout = () => {
  window.bus.$emit(CHATWOOT_RESET);
  window.bus.$emit(ANALYTICS_RESET);
  clearBrowserSessionCookies();
  clearLocalStorageOnLogout();
  const globalConfig = window.globalConfig || {};
  const logoutRedirectLink = globalConfig.LOGOUT_REDIRECT_LINK || '/';
  window.location = logoutRedirectLink;
};

export const parseAPIErrorResponse = error => {
  if (error?.response?.data?.message) {
    return error?.response?.data?.message;
  }
  if (error?.response?.data?.error) {
    return error?.response?.data?.error;
  }
  return error;
};

export const throwErrorMessage = error => {
  const errorMessage = parseAPIErrorResponse(error);
  throw new Error(errorMessage);
};
