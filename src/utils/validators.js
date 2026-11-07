// Validadores de formularios para PawCare
export const validarCorreo = (correo) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
};

export const validarContrasena = (contrasena) => {
  return contrasena && contrasena.length >= 6;
};

export const validarNombre = (nombre) => {
  return nombre && nombre.trim().length >= 2;
};

export const validarPeso = (peso) => {
  const num = parseFloat(peso);
  return !isNaN(num) && num > 0 && num < 200;
};

export const validarFecha = (fecha) => {
  return fecha && !isNaN(new Date(fecha).getTime());
};
