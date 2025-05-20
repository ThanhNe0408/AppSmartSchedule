import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const CreateEventScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');

  const handleSave = () => {
    const newEvent = { title, time, location, note };
    navigation.navigate('ScheduleTab', { newEvent }); // truyền dữ liệu về tab chính
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tên sự kiện</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />
      
      <Text style={styles.label}>Thời gian</Text>
      <TextInput style={styles.input} value={time} onChangeText={setTime} />
      
      <Text style={styles.label}>Địa điểm</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} />
      
      <Text style={styles.label}>Ghi chú</Text>
      <TextInput style={styles.input} value={note} onChangeText={setNote} multiline />
      
      <Button title="Lưu" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontWeight: 'bold', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4 },
});

export default CreateEventScreen;
