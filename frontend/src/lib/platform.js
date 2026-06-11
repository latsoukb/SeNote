/** Mode tablette navigateur (sans code PIN) */
export const isKioskApp = () => process.env.REACT_APP_KIOSK_MODE === 'true';
