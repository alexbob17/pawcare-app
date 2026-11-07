import React from 'react';
import { render } from '@testing-library/react-native';
import HomeTopline from '../src/components/home/HomeTopline';
import ReminderHeroCard from '../src/components/home/ReminderHeroCard';

describe('Componentes Visuales PawCare (Prototipo v2)', () => {
  describe('HomeTopline', () => {
    it('renderiza correctamente el saludo con el nombre de usuario', () => {
      const { getByText } = render(
        <HomeTopline nombre="Alejandro Morales" isDark={false} />
      );

      expect(getByText(/¡Hola, Alejandro!/i)).toBeTruthy();
      expect(getByText(/Un gran día para cuidar a tus mascotas/i)).toBeTruthy();
    });

    it('muestra el saludo por defecto cuando no se provee nombre', () => {
      const { getByText } = render(
        <HomeTopline isDark={false} />
      );

      expect(getByText(/¡Hola, Alejandro!/i)).toBeTruthy();
    });
  });

  describe('ReminderHeroCard', () => {
    it('renderiza el título del recordatorio y la etiqueta correctamente', () => {
      const recordatorioPrueba = {
        id: 'rec_1',
        titulo: 'Vacuna Antirrábica',
        tipo: 'vacuna',
        lugar: 'Clínica San Francisco',
        fecha: '2026-10-30T10:30:00.000Z',
      };

      const { getByText } = render(
        <ReminderHeroCard recordatorio={recordatorioPrueba} mascotaNombre="Missy" />
      );

      expect(getByText(/Próximo recordatorio/i)).toBeTruthy();
      expect(getByText('Vacuna Antirrábica')).toBeTruthy();
    });
  });
});
