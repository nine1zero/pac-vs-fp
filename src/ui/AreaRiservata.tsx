/** Area riservata del fondo (Previnet), da cui si scarica il file DettaglioOperazioni. */
export const AREA_RISERVATA_URL = 'https://funds.previnet.it/w-horizon-ibmdip/login.html#/';

export function AreaRiservata() {
  return (
    <a className="drop-link" href={AREA_RISERVATA_URL} target="_blank" rel="noopener noreferrer">
      Area Riservata
    </a>
  );
}
