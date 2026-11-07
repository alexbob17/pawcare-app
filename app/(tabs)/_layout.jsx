import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { Icon } from '../../src/components/common/Icons';

function ProtoTabItem({ symbol, iconName, label, focused, colors }) {
  const color = focused ? colors.brand : colors.muted;

  return (
    <View style={estilos.tabItemContainer}>
      {iconName ? (
        <Icon
          name={iconName}
          size={20}
          color={color}
          strokeWidth={focused ? 2.3 : 1.9}
        />
      ) : (
        <Text style={[estilos.tabSymbol, { color }]}>{symbol}</Text>
      )}
      <Text
        style={[
          estilos.tabLabel,
          {
            color,
            fontWeight: focused ? '800' : '700',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 8,
          elevation: 6,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <ProtoTabItem
              iconName="home"
              label="Inicio"
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: 'Mascotas',
          tabBarIcon: ({ focused }) => (
            <ProtoTabItem
              symbol="🐾"
              label="Mascotas"
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ focused }) => (
            <ProtoTabItem
              iconName="calendar"
              label="Agenda"
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused }) => (
            <ProtoTabItem
              iconName="compass"
              label="Explorar"
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <ProtoTabItem
              iconName="profile"
              label="Perfil"
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const estilos = StyleSheet.create({
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabSymbol: {
    fontSize: 19,
  },
  tabLabel: {
    fontSize: 11.5,
  },
});
