import {
  validarCorreo,
  validarContrasena,
  validarNombre,
  validarPeso,
  validarFecha,
} from '../src/utils/validators';

describe('Validadores de Formularios PawCare', () => {
  describe('validarCorreo', () => {
    it('debe aceptar correos válidos', () => {
      expect(validarCorreo('alejandro@pawcare.ni')).toBe(true);
      expect(validarCorreo('usuario.prueba@gmail.com')).toBe(true);
    });

    it('debe rechazar correos inválidos', () => {
      expect(validarCorreo('correo_invalido')).toBe(false);
      expect(validarCorreo('sin-arroba.com')).toBe(false);
      expect(validarCorreo('')).toBe(false);
    });
  });

  describe('validarContrasena', () => {
    it('debe aceptar contraseñas de al menos 6 caracteres', () => {
      expect(validarContrasena('123456')).toBe(true);
      expect(validarContrasena('passwordSeguro2026')).toBe(true);
    });

    it('debe rechazar contraseñas cortas o vacías', () => {
      expect(validarContrasena('12345')).toBe(false);
      expect(validarContrasena('')).toBeFalsy();
      expect(validarContrasena(null)).toBeFalsy();
    });
  });

  describe('validarNombre', () => {
    it('debe aceptar nombres de al menos 2 caracteres no vacíos', () => {
      expect(validarNombre('Bobby')).toBe(true);
      expect(validarNombre('Luna')).toBe(true);
    });

    it('debe rechazar nombres vacíos o espacios', () => {
      expect(validarNombre(' ')).toBe(false);
      expect(validarNombre('')).toBeFalsy();
    });
  });

  describe('validarPeso', () => {
    it('debe aceptar pesos numéricos válidos mayores a 0 y menores a 200', () => {
      expect(validarPeso(14.5)).toBe(true);
      expect(validarPeso('4.2')).toBe(true);
      expect(validarPeso('28')).toBe(true);
    });

    it('debe rechazar pesos negativos, cero o desorbitados', () => {
      expect(validarPeso(0)).toBe(false);
      expect(validarPeso(-5)).toBe(false);
      expect(validarPeso(250)).toBe(false);
      expect(validarPeso('abc')).toBe(false);
    });
  });

  describe('validarFecha', () => {
    it('debe aceptar fechas válidas en formato ISO o estándar', () => {
      expect(validarFecha('2023-10-24')).toBe(true);
      expect(validarFecha(new Date().toISOString())).toBe(true);
    });

    it('debe rechazar fechas corruptas', () => {
      expect(validarFecha('fecha-invalida')).toBe(false);
      expect(validarFecha('')).toBeFalsy();
    });
  });
});
