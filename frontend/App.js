import React, { useEffect, useState } from 'react';
import { SafeAreaView, FlatList, Text, TouchableOpacity, View, TextInput, Button, ActivityIndicator } from 'react-native';

const API_URL = 'http://localhost:3000/events'; // Cambia localhost por tu IP si usas dispositivo físico

export default function App() {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [userId, setUserId] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  // Listar eventos futuros
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setEvents);
  }, []);

  // Ver detalle e inscriptos
  const selectEvent = async (event) => {
    setSelected(event);
    setLoading(true);
    const res = await fetch(`${API_URL}/${event.id}/enrollments`);
    setEnrollments(await res.json());
    setLoading(false);
  };

  // Inscribirse
  const enroll = async () => {
    setLoading(true);
    await fetch(`${API_URL}/${selected.id}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_user: userId, description: desc })
    });
    // Refrescar inscriptos
    const res = await fetch(`${API_URL}/${selected.id}/enrollments`);
    setEnrollments(await res.json());
    setLoading(false);
  };

  if (selected) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 20 }}>
        <TouchableOpacity onPress={() => setSelected(null)}>
          <Text style={{ color: 'blue', marginBottom: 10 }}>{'< Volver'}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{selected.name}</Text>
        <Text>{selected.description}</Text>
        <Text>Fecha: {selected.start_date}</Text>
        <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Inscriptos:</Text>
        {loading ? <ActivityIndicator /> : (
          <FlatList
            data={enrollments}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <Text>{item.first_name} {item.last_name} ({item.username})</Text>
            )}
          />
        )}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>Inscribirse:</Text>
          <TextInput
            placeholder="ID de usuario"
            value={userId}
            onChangeText={setUserId}
            style={{ borderWidth: 1, marginBottom: 5, padding: 5 }}
          />
          <TextInput
            placeholder="Descripción"
            value={desc}
            onChangeText={setDesc}
            style={{ borderWidth: 1, marginBottom: 5, padding: 5 }}
          />
          <Button title="Inscribirme" onPress={enroll} disabled={loading || !userId} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Eventos Futuros</Text>
      <FlatList
        data={events}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => selectEvent(item)}>
            <View style={{ padding: 10, borderBottomWidth: 1 }}>
              <Text style={{ fontSize: 18 }}>{item.name}</Text>
              <Text>{item.start_date}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
