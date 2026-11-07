/**
 * Envuelve una promesa con un tiempo máximo de espera.
 * Evita que la interfaz quede "cargando" indefinidamente si no hay conexión.
 */
export const conTimeout = (promesa, ms = 15000) => {
  let timer;
  const limite = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error('La conexión está tardando demasiado. Verifica tu internet e inténtalo de nuevo.');
      err.code = 'app/timeout';
      reject(err);
    }, ms);
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(timer));
};

export default conTimeout;
